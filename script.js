
/* =========================================================
   RUDDRANIL.IO — MAIN WEBSITE SCRIPT
   Supabase Orders + Notifications + Like + Comment + Share
   ========================================================= */

(() => {
  "use strict";

  /* ---------- 1. SUPABASE CONFIGURATION ---------- */

  const SUPABASE_URL = "https://udvvhqjgotwvqfjnfnrn.supabase.co";
  const SUPABASE_KEY = "sb_publishable_oiH3zhFQpyVyxqrlvtRmOA_jPeFsdLV";

  let supabaseClient = null;

  if (window.supabase?.createClient) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
  }

  /* ---------- 2. NOTIFICATION SYSTEM ---------- */

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

    if (box._hideTimer) clearTimeout(box._hideTimer);

    box._hideTimer = setTimeout(() => {
      box.style.display = "none";
    }, 6000);
  }

  /* ---------- 3. SAFE LOCAL STORAGE ---------- */

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      notify("Browser storage unavailable. Please check browser settings.", "error");
      return false;
    }
  }

  /* ---------- 4. CONTACT FORM / ORDER SUBMISSION ---------- */

  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!supabaseClient) {
        notify(
          "Supabase could not load. Check the Supabase CDN script in index.html.",
          "error"
        );
        return;
      }

      const nameInput = document.getElementById("contactName");
      const emailInput = document.getElementById("contactEmail");
      const serviceInput = document.getElementById("contactService");
      const messageInput = document.getElementById("contactMessage");
      const submitButton = contactForm.querySelector('[type="submit"]');

      if (!nameInput || !emailInput || !serviceInput || !messageInput) {
        notify("Contact form fields are missing. Please check index.html.", "error");
        return;
      }

      const customerName = nameInput.value.trim();
      const customerEmail = emailInput.value.trim();
      const service = serviceInput.value;
      const message = messageInput.value.trim();

      if (!customerName || !customerEmail || !service || !message) {
        notify("Please fill in all contact form fields.", "warning");
        return;
      }

      if (!emailInput.checkValidity()) {
        notify("Please enter a valid email address.", "warning");
        emailInput.focus();
        return;
      }

      const oldButtonText = submitButton?.textContent || "Send Message";

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      try {
        const { data: authData, error: authError } =
          await supabaseClient.auth.getUser();

        if (authError) {
          throw authError;
        }

        const user = authData?.user;

        if (!user) {
          notify(
            "Please log in to your account before submitting an order.",
            "warning"
          );

          sessionStorage.setItem("pendingOrderForm", "true");

          setTimeout(() => {
            window.location.href = "login.html";
          }, 1200);

          return;
        }

        const { data: order, error: orderError } = await supabaseClient
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

        if (orderError) {
          console.error("Order submission error:", orderError);
          throw orderError;
        }

        if (!order?.order_id) {
          throw new Error("Order was submitted, but no Order ID was returned.");
        }

        contactForm.reset();

        notify(
          "Order submitted successfully! Your Order ID: " + order.order_id,
          "success"
        );

        alert(
          "Order submitted successfully!\n\n" +
          "Order ID: " + order.order_id +
          "\nStatus: Pending\n\n" +
          "You can track your order from your customer dashboard."
        );

      } catch (error) {
        console.error("Contact/order error:", error);

        let messageText = error?.message || "Unknown error";

        if (
          messageText.toLowerCase().includes("row-level security") ||
          messageText.toLowerCase().includes("policy")
        ) {
          messageText =
            "Database permission blocked the order. Check the orders table RLS policies.";
        } else if (
          messageText.toLowerCase().includes("fetch") ||
          messageText.toLowerCase().includes("network")
        ) {
          messageText =
            "Network or Supabase connection failed. Please try again.";
        }

        notify("Order was not confirmed: " + messageText, "error");

      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = oldButtonText;
        }
      }
    });
  }

  /* ---------- 5. LIKE / UNLIKE ---------- */

  function getPostId(post) {
    if (post.dataset.postId) return post.dataset.postId;

    const heading = post.querySelector("h2, h3, h4");
    const title = heading?.textContent?.trim() || "work-post";

    const allPosts = Array.from(document.querySelectorAll(".work-post"));
    const index = allPosts.indexOf(post);

    post.dataset.postId = "post-" + index + "-" +
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);

    return post.dataset.postId;
  }

  
function setupLikeButtons() {
  document.querySelectorAll(".work-post").forEach((post) => {
    const postId = getPostId(post);

    const likeButton = Array.from(post.querySelectorAll("button"))
      .find((button) => /^like\b/i.test(button.textContent.trim()));

    if (!likeButton || likeButton.dataset.likeReady === "true") return;

    likeButton.dataset.likeReady = "true";

    likeButton.addEventListener("click", async () => {
      notify(
        "Supabase Like connection is being configured.",
        "info"
      );
    });
  });
}

  /* ---------- 6. COMMENTS ---------- */

  function setupCommentButtons() {
    document.querySelectorAll(".work-post").forEach((post) => {
      const postId = getPostId(post);
      const commentButton = Array.from(post.querySelectorAll("button"))
        .find((button) => /^comment\b/i.test(button.textContent.trim()));

      if (!commentButton || commentButton.dataset.commentReady === "true") {
        return;
      }

      commentButton.dataset.commentReady = "true";

      const storageKey = "ruddranil-comments-" + postId;

      const panel = document.createElement("div");
      panel.className = "local-comment-panel";
      panel.hidden = true;

      Object.assign(panel.style, {
        marginTop: "12px",
        padding: "12px",
        borderRadius: "10px",
        background: "rgba(127,127,127,.08)"
      });

      const list = document.createElement("div");
      list.className = "local-comment-list";

      const form = document.createElement("form");
      form.style.display = "flex";
      form.style.flexWrap = "wrap";
      form.style.gap = "8px";
      form.style.marginTop = "10px";

      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Write a comment...";
      input.maxLength = 500;
      input.required = true;
      input.setAttribute("aria-label", "Write a comment");

      Object.assign(input.style, {
        flex: "1 1 180px",
        minWidth: "0",
        padding: "10px",
        borderRadius: "8px",
        border: "1px solid #888"
      });

      const send = document.createElement("button");
      send.type = "submit";
      send.textContent = "Post Comment";

      const empty = document.createElement("p");
      empty.textContent = "No comments yet.";
      empty.className = "comment-empty";

      function renderComments() {
        list.replaceChildren();

        const comments = readJSON(storageKey, []);

        if (!comments.length) {
          list.appendChild(empty);
          return;
        }

        comments.forEach((comment, index) => {
          const item = document.createElement("div");

          Object.assign(item.style, {
            padding: "10px 0",
            borderBottom: "1px solid rgba(127,127,127,.25)"
          });

          const text = document.createElement("p");
          text.textContent = comment.text;
          text.style.margin = "0 0 6px";

          const date = document.createElement("small");
          date.textContent = new Date(comment.createdAt).toLocaleString();

          const remove = document.createElement("button");
          remove.type = "button";
          remove.textContent = "Delete";
          remove.style.marginLeft = "10px";

          remove.addEventListener("click", () => {
            const updated = readJSON(storageKey, []);
            updated.splice(index, 1);
            writeJSON(storageKey, updated);
            renderComments();
            notify("Comment deleted from this browser.", "info");
          });

          item.append(text, date, remove);
          list.appendChild(item);
        });
      }

      form.append(input, send);
      panel.append(list, form);
      commentButton.insertAdjacentElement("afterend", panel);

      commentButton.addEventListener("click", () => {
        panel.hidden = !panel.hidden;

        if (!panel.hidden) {
          renderComments();
          input.focus();
        }
      });

      form.addEventListener("submit", (event) => {
        event.preventDefault();

        const text = input.value.trim();

        if (!text) {
          notify("Please write a comment first.", "warning");
          return;
        }

        const comments = readJSON(storageKey, []);

        comments.push({
          text,
          createdAt: new Date().toISOString()
        });

        if (!writeJSON(storageKey, comments)) return;

        input.value = "";
        renderComments();
        notify("Comment added in this browser.", "success");
      });

      renderComments();
    });
  }

  /* ---------- 7. SHARE ---------- */

  function setupShareButtons() {
    document.querySelectorAll(".work-post").forEach((post) => {
      const shareButton = Array.from(post.querySelectorAll("button"))
        .find((button) => /^share\b/i.test(button.textContent.trim()));

      if (!shareButton || shareButton.dataset.shareReady === "true") return;

      shareButton.dataset.shareReady = "true";

      shareButton.addEventListener("click", async () => {
        const heading = post.querySelector("h2, h3, h4");
        const title = heading?.textContent?.trim() || "Ruddranil.io Work";

        const shareData = {
          title,
          text: "Check out this work on Ruddranil.io",
          url: window.location.href.split("#")[0] + "#" + getPostId(post)
        };

        try {
          if (navigator.share) {
            await navigator.share(shareData);
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareData.url);
            notify("Post link copied. You can share it now.", "success");
          } else {
            window.prompt("Copy this post link:", shareData.url);
          }
        } catch (error) {
          if (error?.name !== "AbortError") {
            console.error("Share error:", error);
            notify("Sharing was cancelled or unavailable.", "warning");
          }
        }
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

          button.addEventListener("click", () => {
            const serviceSelect = document.getElementById("contactService");
            const contactSection = document.getElementById("contact");

            if (serviceSelect) {
              const text = post.textContent.toLowerCase();

              if (text.includes("website")) serviceSelect.value = "website";
              else if (text.includes("graphic") || text.includes("design")) {
                serviceSelect.value = "graphics";
              } else if (text.includes("seo")) serviceSelect.value = "yt-seo";
              else if (text.includes("youtube")) serviceSelect.value = "yt-marketing";
              else if (text.includes("facebook")) serviceSelect.value = "fb-marketing";
            }

            if (contactSection) {
              contactSection.scrollIntoView({ behavior: "smooth" });
            } else {
              window.location.hash = "contact";
            }

            notify("Fill in the contact form to request similar work.", "info");
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
    }

    function closeMenu() {
      sidebar.classList.remove("active", "open");
      sidebar.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
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
      link.addEventListener("click", (event) => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        const target = document.querySelector(href);

        if (target) {
          event.preventDefault();
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          history.replaceState(null, "", href);
        }
      });
    });
  }

  /* ---------- 11. BACK TO TOP ---------- */

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

  /* ---------- 12. REMEMBER ME ---------- */

  function setupRememberMe() {
    const rememberCheckbox = document.querySelector(
      "#rememberMe, input[name='rememberMe'], input[name='remember']"
    );

    const emailInput = document.querySelector(
      "#loginEmail, #email, input[type='email']"
    );

    if (!rememberCheckbox || !emailInput) return;

    const savedEmail = localStorage.getItem("ruddranil-remembered-email");

    if (savedEmail) {
      emailInput.value = savedEmail;
      rememberCheckbox.checked = true;
    }

    rememberCheckbox.addEventListener("change", () => {
      if (rememberCheckbox.checked) {
        localStorage.setItem(
          "ruddranil-remembered-email",
          emailInput.value.trim()
        );
      } else {
        localStorage.removeItem("ruddranil-remembered-email");
      }
    });

    emailInput.addEventListener("change", () => {
      if (rememberCheckbox.checked) {
        localStorage.setItem(
          "ruddranil-remembered-email",
          emailInput.value.trim()
        );
      }
    });
  }

  /* ---------- 13. INITIALIZE ALL FEATURES ---------- */

  function initializeWebsite() {
    setupLikeButtons();
    setupCommentButtons();
    setupShareButtons();
    setupProjectButtons();
    setupMobileMenu();
    setupSmoothScroll();
    setupBackToTop();
    setupRememberMe();

    console.log("Ruddranil.io website script initialized.");

    if (!supabaseClient) {
      console.error(
        "Supabase client missing. Check that the Supabase CDN loads before script.js."
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeWebsite);
  } else {
    initializeWebsite();
  }

})();
