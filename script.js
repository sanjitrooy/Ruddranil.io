/* =====================================================
   RUDDRANIL.IO
   MAIN JAVASCRIPT
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* =================================================
       MOBILE MENU
    ================================================= */

    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {

        menuToggle.addEventListener("click", () => {

            mainNav.classList.toggle("active");

            if (mainNav.classList.contains("active")) {

                menuToggle.textContent = "✕";
                menuToggle.setAttribute(
                    "aria-label",
                    "Close Menu"
                );

            } else {

                menuToggle.textContent = "☰";
                menuToggle.setAttribute(
                    "aria-label",
                    "Open Menu"
                );

            }

        });


        /* Close menu after clicking a navigation link */

        const navLinks =
            document.querySelectorAll(".main-nav a");

        navLinks.forEach((link) => {

            link.addEventListener("click", () => {

                mainNav.classList.remove("active");

                menuToggle.textContent = "☰";

                menuToggle.setAttribute(
                    "aria-label",
                    "Open Menu"
                );

            });

        });

    }


    /* =================================================
       SMOOTH SCROLL
    ================================================= */

    const anchorLinks =
        document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach((link) => {

        link.addEventListener("click", (event) => {

            const targetId =
                link.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =================================================
       ACTIVE NAVIGATION
    ================================================= */

    const sections =
        document.querySelectorAll("section[id]");

    const navigationLinks =
        document.querySelectorAll(".main-nav a");

    const updateActiveNavigation = () => {

        let currentSection = "";

        const scrollPosition =
            window.scrollY + 180;

        sections.forEach((section) => {

            const sectionTop =
                section.offsetTop;

            const sectionHeight =
                section.offsetHeight;

            if (
                scrollPosition >= sectionTop &&
                scrollPosition <
                    sectionTop + sectionHeight
            ) {

                currentSection =
                    section.getAttribute("id");

            }

        });

        navigationLinks.forEach((link) => {

            link.classList.remove("active");

            const href =
                link.getAttribute("href");

            if (
                href === "#" + currentSection
            ) {

                link.classList.add("active");

            }

        });

    };


    window.addEventListener(
        "scroll",
        updateActiveNavigation
    );

    updateActiveNavigation();


    /* =================================================
       HEADER SCROLL EFFECT
    ================================================= */

    const header =
        document.querySelector(".site-header");

    const handleHeaderScroll = () => {

        if (!header) {
            return;
        }

        if (window.scrollY > 30) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    };


    window.addEventListener(
        "scroll",
        handleHeaderScroll
    );

    handleHeaderScroll();


    /* =================================================
       LIKE BUTTON
       FRONT-END DEMO
    ================================================= */

    const likeButtons =
        document.querySelectorAll(
            ".post-actions button"
        );

    likeButtons.forEach((button) => {

        const buttonText =
            button.textContent.trim();

        if (!buttonText.includes("Like")) {
            return;
        }

        button.addEventListener("click", () => {

            const liked =
                button.classList.toggle("liked");

            if (liked) {

                button.innerHTML = "♥ Liked";

            } else {

                button.innerHTML = "♡ Like";

            }

        });

    });


    /* =================================================
       COMMENT BUTTON
       TEMPORARY DEMO
    ================================================= */

    const commentButtons =
        document.querySelectorAll(
            ".post-actions button"
        );

    commentButtons.forEach((button) => {

        const buttonText =
            button.textContent.trim();

        if (!buttonText.includes("Comment")) {
            return;
        }

        button.addEventListener("click", () => {

            alert(
                "Comment system will be available soon."
            );

        });

    });


    /* =================================================
       SHARE BUTTON
    ================================================= */

    const shareButtons =
        document.querySelectorAll(
            ".post-actions button"
        );

    shareButtons.forEach((button) => {

        const buttonText =
            button.textContent.trim();

        if (!buttonText.includes("Share")) {
            return;
        }

        button.addEventListener("click", async () => {

            const currentUrl =
                window.location.href;

            try {

                if (
                    navigator.share
                ) {

                    await navigator.share({
                        title:
                            "Ruddranil Portfolio",
                        text:
                            "Check out this work from Ruddranil.",
                        url:
                            currentUrl
                    });

                } else if (
                    navigator.clipboard
                ) {

                    await navigator.clipboard.writeText(
                        currentUrl
                    );

                    alert(
                        "Page link copied successfully."
                    );

                } else {

                    alert(
                        "Share this page: " +
                        currentUrl
                    );

                }

            } catch (error) {

                console.log(
                    "Share cancelled or unavailable."
                );

            }

        });

    });


    /* =================================================
       CONTACT FORM
       TEMPORARY FRONT-END HANDLER
    ================================================= */

    const contactForm =
        document.getElementById("contactForm");

    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                const name =
                    document.getElementById(
                        "contactName"
                    );

                const email =
                    document.getElementById(
                        "contactEmail"
                    );

                const service =
                    document.getElementById(
                        "contactService"
                    );

                const message =
                    document.getElementById(
                        "contactMessage"
                    );


                if (
                    !name ||
                    !email ||
                    !service ||
                    !message
                ) {

                    return;

                }


                if (
                    !name.value.trim() ||
                    !email.value.trim() ||
                    !service.value ||
                    !message.value.trim()
                ) {

                    alert(
                        "Please complete all required fields."
                    );

                    return;

                }


                alert(
                    "Thank you, " +
                    name.value.trim() +
                    "! Your message has been received."
                );


                contactForm.reset();

            }
        );

    }


    
/* =================================================
   CONTACT FORM
   SUPABASE ORDER SUBMISSION
================================================= */

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("contactName");
        const email = document.getElementById("contactEmail");
        const service = document.getElementById("contactService");
        const message = document.getElementById("contactMessage");

        if (!name || !email || !service || !message) {
            alert("Contact form fields could not be found.");
            return;
        }

        if (
            !name.value.trim() ||
            !email.value.trim() ||
            !service.value ||
            !message.value.trim()
        ) {
            alert("Please complete all required fields.");
            return;
        }

        if (!window.supabase) {
            alert("Supabase library did not load. Please refresh and try again.");
            return;
        }

        // Use the URL and publishable key from your correct Supabase project.
        const SUPABASE_URL = "https://udvvhqjgotwvqfjnfnrn.supabase.co";
        const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_UDVV_PROJECT_PUBLISHABLE_KEY_HERE";

        if (
            !SUPABASE_PUBLISHABLE_KEY ||
            SUPABASE_PUBLISHABLE_KEY === "sb_publishable_oiH3zhFQpyVyxqrlvtRmOA_jPeFsdLV";
        ) {
            alert("Please add your Supabase publishable key in script.js first.");
            return;
        }

        const submitButton = contactForm.querySelector('button[type="submit"]');

        try {
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = "Submitting...";
            }

            const supabaseClient = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );

            const { data: userResult, error: userError } =
                await supabaseClient.auth.getUser();

            if (userError || !userResult.user) {
                alert("Please log in before placing an order.");
                window.location.href = "login.html";
                return;
            }

            const user = userResult.user;

            const { data: order, error: orderError } =
                await supabaseClient
                    .from("orders")
                    .insert({
                        customer_id: user.id,
                        customer_name: name.value.trim(),
                        customer_email: email.value.trim(),
                        service: service.value,
                        message: message.value.trim()
                    })
                    .select("order_id")
                    .single();

            if (orderError) {
                console.error("Order submission error:", orderError);
                alert("Order could not be submitted. Please check your Supabase key, login session, and orders table permissions.");
                return;
            }

            alert(
                "Thank you, " + name.value.trim() +
                "! Your order was submitted successfully.\nOrder ID: " +
                order.order_id
            );

            contactForm.reset();

        } catch (error) {
            console.error("Unexpected order submission error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Send Message";
            }
        }
    });
}



    /* =================================================
       REMEMBER ME
       LOCAL STORAGE DEMO
    ================================================= */

    const rememberMe =
        document.getElementById("rememberMe");

    const loginEmail =
        document.getElementById("loginEmail");


    if (
        rememberMe &&
        loginEmail
    ) {

        const savedEmail =
            localStorage.getItem(
                "ruddranilRememberedEmail"
            );


        if (savedEmail) {

            loginEmail.value =
                savedEmail;

            rememberMe.checked =
                true;

        }


        rememberMe.addEventListener(
            "change",
            () => {

                if (
                    rememberMe.checked &&
                    loginEmail.value.trim()
                ) {

                    localStorage.setItem(
                        "ruddranilRememberedEmail",
                        loginEmail.value.trim()
                    );

                } else {

                    localStorage.removeItem(
                        "ruddranilRememberedEmail"
                    );

                }

            }
        );

    }


    /* =================================================
       SERVICE ORDER BUTTONS
       TEMPORARY
    ================================================= */

    const orderButtons =
        document.querySelectorAll(
            ".service-order-btn, .post-order-btn"
        );


    orderButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                /*
                 * Real order system will be connected later.
                 * For now the button goes to Contact section.
                 */

            }
        );

    });


    /* =================================================
       CURRENT YEAR
    ================================================= */

    const currentYear =
        document.querySelector(
            ".footer-bottom p"
        );


    if (currentYear) {

        const year =
            new Date().getFullYear();

        currentYear.innerHTML =
            currentYear.innerHTML.replace(
                /©\s*\d{4}/,
                "© " + year
            );

    }


    /* =================================================
       PAGE READY
    ================================================= */

    document.body.classList.add("js-ready");

});
