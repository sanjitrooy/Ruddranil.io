    if (!likeButton || likeButton.dataset.likeReady === "true") return;

    likeButton.dataset.likeReady = "true";
    const originalLabel = (likeButton.textContent || "").trim() || "Like";
    if (likeButton.tagName === "BUTTON") likeButton.type = "button";
    likeButton.disabled = false;

    async function refreshLike() {
      const { count, error: countError } = await supabaseClient
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId);

      if (countError) throw countError;

      const { data: sessionData, error: sessionError } =
        await supabaseClient.auth.getSession();

      if (sessionError) throw sessionError;

      const user = sessionData?.session?.user;
      let likedByMe = false;

      if (user) {
        const { data, error } = await supabaseClient
          .from("post_likes")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        likedByMe = Boolean(data);
      }

      likeButton.textContent =
        (likedByMe ? "♥ Liked" : "♡ Like") + " (" + (count || 0) + ")";

      likeButton.setAttribute("aria-pressed", String(likedByMe));
      likeButton.dataset.liked = String(likedByMe);
    }

    likeButton.addEventListener("click", async (event) => {
      event.preventDefault();

      if (likeButton.dataset.processing === "true") return;
      likeButton.dataset.processing = "true";
      likeButton.disabled = true;

      try {
        const user = await ensureLikeUser();
        const currentlyLiked = likeButton.dataset.liked === "true";

        if (currentlyLiked) {
          const { error } = await supabaseClient
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", user.id);

          if (error) throw error;
          notify("Like removed.", "info");
        } else {
          const { error } = await supabaseClient
            .from("post_likes")
            .insert({
              post_id: postId,
              user_id: user.id
            });

          if (error && !String(error.code).includes("23505")) {
            throw error;
          }

          notify("You liked this post.", "success");
        }

        await refreshLike();
      } catch (error) {
        console.error("Like action failed:", error);
        notify(
          "Like failed: " + (error.message || "Check Supabase settings."),
          "error"
        );
      } finally {
        likeButton.disabled = false;
        likeButton.dataset.processing = "false";
      }
    });

    refreshLike().catch((error) => {
      console.error("Could not load like count:", error);
      likeButton.textContent = originalLabel;
    });
  });
}

/* ---------- 6. COMMENTS ---------- */

async function ensureCommentUser() {
  if (!supabaseClient) throw new Error("Supabase client did not load.");

  const { data: sessionData, error: sessionError } =
    await supabaseClient.auth.getSession();

  if (sessionError) throw sessionError;
  if (sessionData?.session?.user) return sessionData.session.user;

  const { data, error } = await supabaseClient.auth.signInAnonymously();

  if (error) throw error;
  if (!data?.user) {
    throw new Error(
      "Anonymous sign-in failed. Enable Anonymous Sign-Ins in Supabase."
    );
  }

  return data.user;
}

function setupCommentButtons() {
  if (!supabaseClient) return;

  document.querySelectorAll(".work-post").forEach((post) => {
    const postId = getPostId(post);
    const commentButton = findPostActionButton(post, "comment");

    if (!commentButton || commentButton.dataset.commentReady === "true") {
      return;
    }

    commentButton.dataset.commentReady = "true";
    if (commentButton.tagName === "BUTTON") {
      commentButton.type = "button";
    }

    const panel = document.createElement("div");
    panel.className = "comments-panel";
    panel.hidden = true;
    panel.style.cssText =
      "margin-top:12px;padding:14px;border:1px solid #ddd;border-radius:12px;";

    const list = document.createElement("div");
    list.className = "comments-list";
    list.setAttribute("aria-live", "polite");

    const form = document.createElement("form");
    form.className = "comment-form";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.maxLength = 80;
    nameInput.required = true;
    nameInput.placeholder = "Your name";
    nameInput.setAttribute("aria-label", "Your name");

    const commentInput = document.createElement("textarea");
    commentInput.maxLength = 1000;
    commentInput.required = true;
    commentInput.placeholder = "Write a comment...";
    commentInput.setAttribute("aria-label", "Write a comment");

    const submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "💬 Post Comment";

    form.append(nameInput, commentInput, submitButton);
    panel.append(list, form);
    commentButton.insertAdjacentElement("afterend", panel);

    async function loadComments() {
      list.replaceChildren();

      const loading = document.createElement("p");
      loading.textContent = "Loading comments...";
      list.appendChild(loading);

      const { data, error } = await supabaseClient
        .from("post_comments")
        .select("id, display_name, comment_text, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      list.replaceChildren();

      if (!data || data.length === 0) {
        const empty = document.createElement("p");
        empty.textContent = "No comments yet. Be the first to comment!";
        list.appendChild(empty);
        return;
      }

      data.forEach((comment) => {
        const item = document.createElement("article");
        item.className = "comment-item";
        item.style.cssText =
          "padding:10px 0;border-bottom:1px solid #eee;";

        const name = document.createElement("strong");
        name.textContent = comment.display_name || "Visitor";

        const text = document.createElement("p");
        text.textContent = comment.comment_text || "";
        text.style.whiteSpace = "pre-wrap";

        const date = document.createElement("small");
        date.textContent = comment.created_at
          ? new Date(comment.created_at).toLocaleString()
          : "";

        item.append(name, text, date);
        list.appendChild(item);
      });
    }

    commentButton.addEventListener("click", async (event) => {
      event.preventDefault();
      panel.hidden = !panel.hidden;

      if (!panel.hidden) {
        try {
          await loadComments();
          nameInput.focus();
        } catch (error) {
          console.error("Loading comments failed:", error);
          notify("Could not load comments. Check Supabase permissions.", "error");
        }
      }
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const displayName = nameInput.value.trim();
      const commentText = commentInput.value.trim();

      if (!displayName || displayName.length > 80) {
        notify("Enter your name (maximum 80 characters).", "warning");
        return;
      }

      if (!commentText || commentText.length > 1000) {
        notify("Write a comment (maximum 1000 characters).", "warning");
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = "Posting...";

      try {
        const user = await ensureCommentUser();

        const { error } = await supabaseClient
          .from("post_comments")
          .insert({
            post_id: postId,
            display_name: displayName,
            comment_text: commentText,
            user_id: user.id
          });

        if (error) throw error;

        commentInput.value = "";
        await loadComments();
        notify("Comment posted successfully!", "success");
      } catch (error) {
        console.error("Post comment error:", error);
        notify(
          "Comment failed: " + (error.message || "Check Supabase settings."),
          "error"
        );
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = "💬 Post Comment";
      }
    });
  });
}

/* ---------- 7. SHARE ---------- */

function setupShareButtons() {
  document.querySelectorAll(".work-post").forEach((post) => {
    const shareButton = findPostActionButton(post, "share");

    if (!shareButton || shareButton.dataset.shareReady === "true") {
      return;
    }

    const postId = getPostId(post);
    shareButton.dataset.shareReady = "true";

    if (shareButton.tagName === "BUTTON") {
      shareButton.type = "button";
    }

    shareButton.addEventListener("click", async (event) => {
      event.preventDefault();

      const heading = post.querySelector("h2, h3, h4");
      const title = heading?.textContent?.trim() || "Ruddranil.io Work";
      const url = new URL(window.location.href);

      url.hash = postId;

      const shareData = {
        title,
        text: "Check out this work on Ruddranil.io",
        url: url.href
      };

      try {
        if (typeof navigator.share === "function") {
          await navigator.share(shareData);
          notify("Post shared successfully.", "success");
          return;
        }
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.warn("Native share unavailable:", error);
      }

      try {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
          await navigator.clipboard.writeText(shareData.url);
          notify("Post link copied. You can share it now.", "success");
          return;
        }
      } catch (error) {
        console.warn("Clipboard copy failed:", error);
      }

      window.prompt("Copy this post link:", shareData.url);
    });
  });
}

/* ---------- 8. VIEW PROJECT / ORDER SIMILAR ---------- */

function setupProjectButtons() {
  document.querySelectorAll(".work-post").forEach((post) => {
    const buttons = Array.from(post.querySelectorAll("button"));

    buttons.forEach((button) => {
      if (button.dataset.projectActionReady === "true") return;

      if (/^view project$/i.test(button.textContent.trim())) {
        button.dataset.projectActionReady = "true";
        button.type = "button";

        button.addEventListener("click", () => {
          const link = post.querySelector("a[href]");

          if (link) {
            window.location.href = link.href;
          } else {
            notify(
              "Project details are not linked yet. Add a project URL to this post.",
              "info"
            );
          }
        });
      }

      if (/^order similar$/i.test(button.textContent.trim())) {
        button.dataset.projectActionReady = "true";
        button.type = "button";

        button.addEventListener("click", () => {
          const serviceSelect = document.getElementById("contactService");
          const contactSection = document.getElementById("contact");

          if (serviceSelect) {
            const text = post.textContent.toLowerCase();

            if (text.includes("website")) {
              serviceSelect.value = "website";
            } else if (text.includes("graphic") || text.includes("design")) {
              serviceSelect.value = "graphics";
            } else if (text.includes("seo")) {
              serviceSelect.value = "yt-seo";
            } else if (text.includes("youtube")) {
              serviceSelect.value = "yt-marketing";
            } else if (text.includes("facebook")) {
              serviceSelect.value = "fb-marketing";
            }
          }

          if (contactSection) {
            contactSection.scrollIntoView({ behavior: "smooth" });
          } else {
            window.location.hash = "contact";
          }

          notify(
            "Fill in the contact form to request similar work.",
            "info"
          );
        });
      }
    });
  });
}

/* ---------- 9. MOBILE MENU ---------- */

function setupMobileMenu() {
  const menuButton = document.querySelector(
    "#menuToggle, #menuBtn, .menu-toggle, .hamburger, [aria-label='Open menu']"
  );

  const closeButton = document.querySelector(
    "#closeMenu, .close-menu, .sidebar-close"
  );

  const sidebar = document.querySelector(
    "#sidebar, .sidebar, .mobile-menu, .nav-menu"
  );

  if (!sidebar) return;

  function openMenu() {
    sidebar.classList.add("active", "open");
    sidebar.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "true");
    }
  }

  function closeMenu() {
    sidebar.classList.remove("active", "open");
    sidebar.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");

    if (menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
  }

  menuButton?.addEventListener("click", openMenu);
  closeButton?.addEventListener("click", closeMenu);

  sidebar.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });
}

/* ---------- 10. SMOOTH SCROLL ---------- */

function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    if (link.dataset.smoothScrollReady === "true") return;
    link.dataset.smoothScrollReady = "true";

    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");

      if (!href || href === "#") return;

      let target;

      try {
        target = document.querySelector(href);
      } catch {
        return;
      }

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

        history.replaceState(null, "", href);
      }
    });
  });
} 

/* ---------- 11. BACK TO TOP ---------- */

function setupBackToTop() {
  const button = document.getElementById("backToTop");

  if (!button || button.dataset.backToTopReady === "true") return;

  button.dataset.backToTopReady = "true";
  button.type = "button";

  button.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  function updateButton() {
    button.hidden = window.scrollY < 300;
  }

  window.addEventListener("scroll", updateButton, { passive: true });
  updateButton();
}

/* ---------- 12. REMEMBER ME ---------- */

function setupRememberMe() {
  const rememberCheckbox = document.querySelector(
    "#rememberMe, input[name='rememberMe'], input[name='remember']"
  );

  const emailInput = document.querySelector(
    "#loginEmail, #email, input[type='email']"
  );

  if (!rememberCheckbox || !emailInput) return;

  let savedEmail = "";

  try {
    savedEmail = localStorage.getItem("ruddranil-remembered-email") || "";
  } catch (error) {
    console.warn("Remember Me storage unavailable:", error);
  }

  if (savedEmail) {
    emailInput.value = savedEmail;
    rememberCheckbox.checked = true;
  }

  function saveRememberedEmail() {
    try {
      if (rememberCheckbox.checked) {
        localStorage.setItem(
          "ruddranil-remembered-email",
          emailInput.value.trim()
        );
      } else {
        localStorage.removeItem("ruddranil-remembered-email");
      }
    } catch (error) {
      console.warn("Could not save remembered email:", error);
    }
  }

  rememberCheckbox.addEventListener("change", saveRememberedEmail);
  emailInput.addEventListener("change", saveRememberedEmail);
}

/* ---------- 13. INITIALIZE ALL FEATURES ---------- */

function initializeWebsite() {
  const features = [
    ["Like buttons", setupLikeButtons],
    ["Comment buttons", setupCommentButtons],
    ["Share buttons", setupShareButtons],
    ["Project buttons", setupProjectButtons],
    ["Mobile menu", setupMobileMenu],
    ["Smooth scroll", setupSmoothScroll],
    ["Back to top", setupBackToTop],
    ["Remember me", setupRememberMe]
  ];

  console.log("Initializing Ruddranil.io...");

  features.forEach(([name, setup]) => {
    try {
      console.log("Starting:", name);

      const result = setup();

      if (result && typeof result.catch === "function") {
        result.catch((error) => {
          console.error(name + " initialization failed:", error);
        });
      }

      console.log("Initialized:", name);
    } catch (error) {
      console.error(name + " initialization failed:", error);
    }
  });

  if (!supabaseClient) {
    console.error("Supabase client is missing.");
    notify("Supabase connection is unavailable.", "error");
  } else {
    console.log("Supabase client exists.");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeWebsite);
} else {
  initializeWebsite();
}
})();
