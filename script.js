/* =====================================================
   RUDDRANIL.IO — MAIN WEBSITE SCRIPT
   Supabase Orders + Like + Comment + Share
   ===================================================== */

(() => {
  "use strict";

  /* 1. SUPABASE CONFIGURATION */

  const SUPABASE_URL =
    "https://udvvhqjgotwvqfjnfnrn.supabase.co";

  const SUPABASE_KEY =
    "sb_publishable_oiH3zhFQpyVyxqrlvtRmOA_jPeFsdLV";

  let supabaseClient = null;

  try {
    if (window.supabase?.createClient) {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );
    } else {
      console.error(
        "Supabase CDN missing. Check index.html."
      );
    }
  } catch (error) {
    console.error("Supabase initialization failed:", error);
  }

  /* 2. NOTIFICATION SYSTEM */

  function notify(message, type = "info") {
    let box = document.getElementById("siteNotification");

    if (!box) {
      box = document.createElement("div");
      box.id = "siteNotification";

      Object.assign(box.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: "999999",
        maxWidth: "min(390px, calc(100vw - 40px))",
        padding: "15px 18px",
        borderRadius: "12px",
        color: "#fff",
        fontSize: "14px",
        lineHeight: "1.5",
        boxShadow: "0 8px 30px rgba(0,0,0,.25)",
        display: "none",
        overflowWrap: "anywhere"
      });

      document.body.appendChild(box);
    }

    const colors = {
      success: "#16803d",
      error: "#b42318",
      info: "#2457c5",
      warning: "#9a6700"
    };

    box.style.background = colors[type] || colors.info;
    box.textContent = message;
    box.style.display = "block";

    if (box._hideTimer) {
      clearTimeout(box._hideTimer);
    }

    box._hideTimer = setTimeout(() => {
      box.style.display = "none";
    }, 6000);
  }

  /* 3. POST HELPERS */

  function getPostId(post) {
    if (!post) return "work-post";

    if (post.dataset.postId) {
      return post.dataset.postId;
    }

    const heading = post.querySelector("h2, h3, h4");
    const title = heading?.textContent?.trim() || "work-post";

    const slug = title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "work-post";

    post.dataset.postId = "post-" + slug;
    post.id = post.id || post.dataset.postId;

    return post.dataset.postId;
  }

  function findPostActionButton(post, action) {
    const explicit = post.querySelector(
      `[data-action="${action}"], [data-post-action="${action}"]`
    );

    if (explicit) return explicit;

    const pattern = new RegExp("\\b" + action + "\\b", "i");

    return Array.from(
      post.querySelectorAll("button, [role='button'], a")
    ).find((element) =>
      pattern.test((element.textContent || "").trim())
    );
  }

  async function ensureAnonymousOrExistingUser() {
    if (!supabaseClient) {
      throw new Error("Supabase client did not load.");
    }

    const { data, error } =
      await supabaseClient.auth.getSession();

    if (error) throw error;

    if (data?.session?.user) {
      return data.session.user;
    }

    const { data: anonymousData, error: anonymousError } =
      await supabaseClient.auth.signInAnonymously();

    if (anonymousError) throw anonymousError;

    if (!anonymousData?.user) {
      throw new Error(
        "Anonymous sign-in failed. Enable Anonymous Sign-Ins in Supabase."
      );
    }

    return anonymousData.user;
  }

  /* 4. CONTACT FORM AND ORDER SUBMISSION */

  function setupContactForm() {
    const form = document.getElementById("contactForm");

    if (!form || form.dataset.ready === "true") return;

    form.dataset.ready = "true";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!supabaseClient) {
        notify("Supabase connection failed.", "error");
        return;
      }

      const nameInput = document.getElementById("contactName");
      const emailInput = document.getElementById("contactEmail");
      const serviceInput = document.getElementById("contactService");
      const messageInput = document.getElementById("contactMessage");
      const submitButton = form.querySelector('[type="submit"]');

      if (!nameInput || !emailInput || !serviceInput || !messageInput) {
        notify("Contact form fields are missing.", "error");
        return;
      }

      const customerName = nameInput.value.trim();
      const customerEmail = emailInput.value.trim();
      const service = serviceInput.value;
      const message = messageInput.value.trim();

      if (!customerName || !customerEmail || !service || !message) {
        notify("Please complete all fields.", "warning");
        return;
      }

      if (!emailInput.checkValidity()) {
        notify("Enter a valid email address.", "warning");
        emailInput.focus();
        return;
      }

      const oldText = submitButton?.textContent || "Send Message";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      try {
        const { data: authData, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) throw authError;

        const user = authData?.user;

        if (!user) {
          sessionStorage.setItem("pendingOrderForm", "true");

          notify(
            "Please log in before placing an order.",
            "warning"
          );

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1000);

          return;
        }

        const { data: order, error: orderError } =
          await supabaseClient
            .from("orders")
            .insert({
              customer_id: user.id,
              customer_name: customerName,
              customer_email: user.email || customerEmail,
              service: service,
              message: message,
              status: "Pending",
              progress: 0
            })
            .select("order_id")
            .single();

        if (orderError) throw orderError;

        if (!order?.order_id) {
          throw new Error("Order ID was not returned.");
        }

        form.reset();

        notify(
          "Order submitted! Order ID: " + order.order_id,
          "success"
        );

        alert(
          "Order submitted successfully!\n\n" +
          "Order ID: " + order.order_id +
          "\nStatus: Pending\n\n" +
          "Track your order from your customer dashboard."
        );

      } catch (error) {
        console.error("Order submission error:", error);

        notify(
          "Order failed: " + (error?.message || "Unknown error"),
          "error"
        );

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = oldText;
        }
      }
    });
  }

  /* 5. LIKE / UNLIKE */

  async function setupLikeButtons() {
    if (!supabaseClient) return;

    document.querySelectorAll(".work-post").forEach((post) => {
      const postId = getPostId(post);
      const button = findPostActionButton(post, "like");

      if (!button || button.dataset.likeReady === "true") return;

      button.dataset.likeReady = "true";

      if (button.tagName === "BUTTON") {
        button.type = "button";
      }

      async function refreshLike() {
        const { count, error: countError } =
          await supabaseClient
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

        button.textContent =
          (likedByMe ? "♥ Liked" : "♡ Like") +
          " (" + (count || 0) + ")";

        button.setAttribute("aria-pressed", String(likedByMe));
        button.dataset.liked = String(likedByMe);
      }

      button.addEventListener("click", async (event) => {
        event.preventDefault();

        if (button.disabled) return;

        button.disabled = true;

        try {
          const user = await ensureAnonymousOrExistingUser();

          const { data: existing, error: findError } =
            await supabaseClient
              .from("post_likes")
              .select("id")
              .eq("post_id", postId)
              .eq("user_id", user.id)
              .maybeSingle();

          if (findError) throw findError;

          if (existing) {
            const { error } = await supabaseClient
              .from("post_likes")
              .delete()
              .eq("id", existing.id);

            if (error) throw error;
          } else {
            const { error } = await supabaseClient
              .from("post_likes")
              .insert({
                post_id: postId,
                user_id: user.id
              });

            if (error) throw error;
          }

          await refreshLike();

        } catch (error) {
          console.error("Like error:", error);

          notify(
            "Like failed: " + (error?.message || "Check Supabase policies."),
            "error"
          );

        } finally {
          button.disabled = false;
        }
      });

      refreshLike().catch((error) => {
        console.error("Could not load likes:", error);
        button.textContent = "♡ Like";
      });
    });
  }

  /* 6. COMMENTS */

  function setupCommentButtons() {
    if (!supabaseClient) return;

    document.querySelectorAll(".work-post").forEach((post) => {
      const postId = getPostId(post);
      const button = findPostActionButton(post, "comment");

      if (!button || button.dataset.commentReady === "true") return;

      button.dataset.commentReady = "true";

      if (button.tagName === "BUTTON") {
        button.type = "button";
      }

      button.textContent = "💬 Comment";

      const panel = document.createElement("div");
      panel.className = "comment-panel";
      panel.hidden = true;

      Object.assign(panel.style, {
        marginTop: "14px",
        padding: "14px",
        borderRadius: "12px",
        background: "rgba(127,127,127,.08)"
      });

      const list = document.createElement("div");
      const form = document.createElement("form");

      Object.assign(form.style, {
        display: "grid",
        gap: "10px",
        marginTop: "12px"
      });

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Your name";
      nameInput.maxLength = 80;
      nameInput.required = true;

      const commentInput = document.createElement("textarea");
      commentInput.placeholder = "Write a comment...";
      commentInput.maxLength = 1000;
      commentInput.rows = 3;
      commentInput.required = true;

      const submit = document.createElement("button");
      submit.type = "submit";
      submit.textContent = "💬 Post Comment";

      [nameInput, commentInput].forEach((input) => {
        Object.assign(input.style, {
          width: "100%",
          boxSizing: "border-box",
          padding: "11px",
          border: "1px solid #aaa",
          borderRadius: "9px",
          font: "inherit"
        });
      });

      async function loadComments() {
        list.replaceChildren();

        const { data, error } = await supabaseClient
          .from("post_comments")
          .select("id, display_name, comment_text, created_at")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Load comments error:", error);
          list.textContent = "Could not load comments.";
          return;
        }

        if (!data || data.length === 0) {
          list.textContent = "No comments yet.";
          return;
        }

        data.forEach((comment) => {
          const item = document.createElement("div");
          item.style.padding = "10px 0";
          item.style.borderBottom = "1px solid rgba(127,127,127,.25)";

          const name = document.createElement("strong");
          name.textContent = comment.display_name || "Visitor";

          const text = document.createElement("p");
          text.textContent = comment.comment_text;
          text.style.margin = "5px 0";

          const date = document.createElement("small");
          date.textContent = comment.created_at
            ? new Date(comment.created_at).toLocaleString()
            : "";

          item.append(name, text, date);
          list.appendChild(item);
        });
      }

      form.append(nameInput, commentInput, submit);
      panel.append(list, form);
      button.insertAdjacentElement("afterend", panel);

      button.addEventListener("click", async (event) => {
        event.preventDefault();
        panel.hidden = !panel.hidden;

        if (!panel.hidden) {
          await loadComments();
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

        submit.disabled = true;
        submit.textContent = "Posting...";

        try {
          const user = await ensureAnonymousOrExistingUser();

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

          notify("Comment posted successfully.", "success");

        } catch (error) {
          console.error("Comment error:", error);

          notify(
            "Comment failed: " + (error?.message || "Check Supabase policies."),
            "error"
          );

        } finally {
          submit.disabled = false;
          submit.textContent = "💬 Post Comment";
        }
      });
    });
  }

  /* 7. SHARE BUTTON */

  function setupShareButtons() {
    document.querySelectorAll(".work-post").forEach((post) => {
      const button = findPostActionButton(post, "share");

      if (!button || button.dataset.shareReady === "true") return;

      button.dataset.shareReady = "true";

      if (button.tagName === "BUTTON") {
        button.type = "button";
      }

      button.addEventListener("click", async (event) => {
        event.preventDefault();

        const heading = post.querySelector("h2, h3, h4");
        const title = heading?.textContent?.trim() || "Ruddranil.io Work";

        const url = new URL(window.location.href);
        url.hash = getPostId(post);

        try {
          if (navigator.share) {
            await navigator.share({
              title,
              text: "Check out this work on Ruddranil.io",
              url: url.href
            });
            return;
          }
        } catch (error) {
          if (error?.name === "AbortError") return;
          console.warn("Native share failed:", error);
        }

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url.href);
            notify("Post link copied.", "success");
            return;
          }
        } catch (error) {
          console.warn("Clipboard failed:", error);
        }

        window.prompt("Copy this post link:", url.href);
      });
    });
  }

  /* 8. ORDER SIMILAR */

  function setupProjectButtons() {
    document.querySelectorAll(".work-post").forEach((post) => {
      const orderLink = post.querySelector(".post-order-btn");

      if (orderLink && orderLink.dataset.ready !== "true") {
        orderLink.dataset.ready = "true";

        orderLink.addEventListener("click", (event) => {
          const serviceSelect = document.getElementById("contactService");

          if (serviceSelect) {
            const content = post.textContent.toLowerCase();

            if (content.includes("website")) {
              serviceSelect.value = "website";
            } else if (content.includes("graphic") || content.includes("design")) {
              serviceSelect.value = "graphics";
            } else if (content.includes("seo")) {
              serviceSelect.value = "yt-seo";
            } else if (content.includes("youtube")) {
              serviceSelect.value = "yt-marketing";
            } else if (content.includes("facebook")) {
              serviceSelect.value = "fb-marketing";
            }
          }

          const contact = document.getElementById("contact");

          if (contact) {
            event.preventDefault();
            contact.scrollIntoView({ behavior: "smooth" });
          }
        });
      }
    });
  }

  /* 9. MOBILE MENU */

  function setupMobileMenu() {
    const menuButton = document.querySelector(
      "#menuToggle, #menuBtn, .menu-toggle, .hamburger"
    );

    const nav = document.querySelector(
      "#mainNav, #sidebar, .sidebar, .mobile-menu, .nav-menu"
    );

    const closeButton = document.querySelector(
      "#closeMenu, .close-menu, .sidebar-close"
    );

    if (!nav) return;

    function openMenu() {
      nav.classList.add("active", "open");
      nav.setAttribute("aria-expanded", "true");
      document.body.classList.add("menu-open");
      menuButton?.setAttribute("aria-expanded", "true");
    }

    function closeMenu() {
      nav.classList.remove("active", "open");
      nav.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
      menuButton?.setAttribute("aria-expanded", "false");
    }

    menuButton?.addEventListener("click", () => {
      if (nav.classList.contains("active") || nav.classList.contains("open")) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    closeButton?.addEventListener("click", closeMenu);

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu();
    });
  }

  /* 10. SMOOTH SCROLL */

  function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
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

  /* 11. BACK TO TOP */

  function setupBackToTop() {
    const button = document.getElementById("backToTop");

    if (!button) return;

    button.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    function updateButton() {
      button.hidden = window.scrollY < 300;
    }

    window.addEventListener("scroll", updateButton, { passive: true });
    updateButton();
  }

  /* 12. REMEMBER ME */

  function setupRememberMe() {
    const checkbox = document.querySelector(
      "#rememberMe, input[name='rememberMe'], input[name='remember']"
    );

    const emailInput = document.querySelector(
      "#loginEmail, #email, input[type='email']"
    );

    if (!checkbox || !emailInput) return;

    const storageKey = "ruddranil-remembered-email";

    try {
      const savedEmail = localStorage.getItem(storageKey);

      if (savedEmail) {
        emailInput.value = savedEmail;
        checkbox.checked = true;
      }
    } catch (error) {
      console.warn("Remember Me storage unavailable:", error);
    }

    function saveEmail() {
      try {
        if (checkbox.checked) {
          localStorage.setItem(storageKey, emailInput.value.trim());
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn("Could not save remembered email:", error);
      }
    }

    checkbox.addEventListener("change", saveEmail);
    emailInput.addEventListener("change", saveEmail);
  }

  /* 13. INITIALIZE */

  function initializeWebsite() {
    const features = [
      ["Contact form", setupContactForm],
      ["Like buttons", setupLikeButtons],
      ["Comment buttons", setupCommentButtons],
      ["Share buttons", setupShareButtons],
      ["Project buttons", setupProjectButtons],
      ["Mobile menu", setupMobileMenu],
      ["Smooth scroll", setupSmoothScroll],
      ["Back to top", setupBackToTop],
      ["Remember Me", setupRememberMe]
    ];

    features.forEach(([name, setup]) => {
      try {
        const result = setup();

        if (result && typeof result.catch === "function") {
          result.catch((error) => {
            console.error(name + " initialization failed:", error);
          });
        }
      } catch (error) {
        console.error(name + " initialization failed:", error);
      }
    });

    console.log("Ruddranil.io script initialized.");

    if (!supabaseClient) {
      notify(
        "Supabase did not load. Check the CDN script in index.html.",
        "error"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWebsite);
  } else {
    initializeWebsite();
  }

})();
