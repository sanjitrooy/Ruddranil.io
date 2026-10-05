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
       LOGIN FORM
       TEMPORARY FRONT-END HANDLER
    ================================================= */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                const email =
                    document.getElementById(
                        "loginEmail"
                    );

                const password =
                    document.getElementById(
                        "loginPassword"
                    );


                if (
                    !email ||
                    !password
                ) {

                    return;

                }


                if (
                    !email.value.trim() ||
                    !password.value.trim()
                ) {

                    alert(
                        "Please enter your email and password."
                    );

                    return;

                }


                alert(
                    "Login system will be connected to the secure account system soon."
                );

            }
        );

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
