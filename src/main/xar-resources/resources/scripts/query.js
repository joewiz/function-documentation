document.addEventListener("DOMContentLoaded", function () {
    let timeout = 0;

    // Modal handling
    function showModal(element) {
        if (element) element.style.display = "block";
    }

    function hideModal(element) {
        if (element) element.style.display = "none";
    }

    const loginDialog = document.getElementById("loginDialog");
    if (loginDialog) hideModal(loginDialog);

    function updateResultCount() {
        const results = document.getElementById("results");
        const counter = document.getElementById("result-count");
        if (!results || !counter) return;
        const functions = results.querySelectorAll(".function");
        const modules = results.querySelectorAll(".module");
        if (functions.length > 0) {
            counter.textContent =
                functions.length + " function" + (functions.length !== 1 ? "s" : "") +
                " in " + modules.length + " module" + (modules.length !== 1 ? "s" : "");
        } else {
            counter.textContent = "";
        }
    }

    function updateURL() {
        const form = document.getElementById("fun-query-form");
        if (!form) return;
        const q = form.querySelector('[name="q"]');
        const where = form.querySelector('[name="where"]');
        const params = new URLSearchParams();
        if (q && q.value) params.set("q", q.value);
        if (where && where.value !== "everywhere") params.set("where", where.value);
        params.set("action", "search");
        const newURL = window.location.pathname + "?" + params.toString();
        history.replaceState(null, "", newURL);
    }

    function search() {
        const form = document.getElementById("fun-query-form");
        if (!form) return;
        const formData = new FormData(form);
        formData.append("action", "search");

        updateURL();

        fetch("query", {
            method: "POST",
            body: new URLSearchParams(formData),
        })
            .then((response) => response.text())
            .then((data) => {
                const results = document.getElementById("results");
                if (results) {
                    results.style.display = "none";
                    results.innerHTML = data;
                    results.style.display = "block";
                    hljs.highlightAll();
                    updateResultCount();
                    const emptyState = document.getElementById("empty-state");
                    if (results.querySelectorAll(".function").length === 0 && formData.get("q")) {
                        if (!emptyState) {
                            const msg = document.createElement("div");
                            msg.id = "empty-state";
                            msg.className = "alert alert-info";
                            msg.textContent = 'No results found for "' + formData.get("q") + '". Try a different search term or search location.';
                            results.appendChild(msg);
                        }
                    }
                }
                timeout = null;
            });
    }

    function reindexIfLoggedIn(event) {
        event.preventDefault();

        fetch("login", { headers: { Accept: "application/json" } })
            .then((response) => {
                if (!response.ok) throw new Error();
                return response.json();
            })
            .then(reindex)
            .catch(() => showModal(loginDialog));
    }

    function reindex() {
        const messages = document.getElementById("messages");
        const loadIndicator = document.getElementById("f-load-indicator");
        if (messages) messages.innerHTML = "";
        if (loadIndicator) loadIndicator.style.display = "block";

        fetch("regenerate", {
            headers: { Accept: "application/json" },
        })
            .then((response) => response.json())
            .then((data) => {
                if (loadIndicator) loadIndicator.style.display = "none";
                if (data.status === "failed") {
                    if (messages) messages.textContent = data.message;
                } else {
                    window.location.reload();
                }
            });
    }

    if (loginDialog) {
        const form = loginDialog.querySelector("form");
        if (form) {
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                const formData = new FormData(this);

                fetch("login", {
                    method: "POST",
                    body: new URLSearchParams(formData),
                    headers: { Accept: "application/json" },
                })
                    .then((response) => {
                        if (!response.ok) throw new Error();
                        return response.json();
                    })
                    .then(() => {
                        hideModal(loginDialog);
                        reindex();
                    })
                    .catch(() => {
                        const loginMessage = loginDialog.querySelector(".login-message");
                        if (loginMessage) {
                            loginMessage.style.display = "block";
                            loginMessage.textContent = "Login failed!";
                        }
                    });
            });
        }
    }

    const loadIndicator = document.getElementById("f-load-indicator");
    if (loadIndicator) loadIndicator.style.display = "none";

    const queryField = document.getElementById("query-field");
    if (queryField) {
        queryField.addEventListener("keyup", function () {
            const val = this.value;
            if (val.length > 3) {
                if (timeout) clearTimeout(timeout);
                timeout = setTimeout(search, 300);
            }
        });

        // Restore search from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get("q");
        const whereParam = urlParams.get("where");
        if (qParam && qParam.length > 3) {
            queryField.value = qParam;
            const whereSelect = document.getElementById("searchWhereSelect");
            if (whereParam && whereSelect) {
                whereSelect.value = whereParam;
            }
            search();
        }
    }

    const btnReindexRegen = document.getElementById("f-btn-reindex-regen");
    if (btnReindexRegen) {
        btnReindexRegen.addEventListener("click", reindexIfLoggedIn);
    }

    const tooltips = document.querySelectorAll("#fun-query-form [data-toggle='tooltip']");
    tooltips.forEach((tooltip) => {
        tooltip.addEventListener("mouseover", () => {
            tooltip.title = tooltip.getAttribute("data-title") || "Tooltip";
        });
    });

    // Deprecated function toggle
    const showDeprecated = document.getElementById("show-deprecated");
    const results = document.getElementById("results");
    if (showDeprecated && results) {
        // Default: hide deprecated
        results.classList.add("hide-deprecated");
        showDeprecated.addEventListener("change", function () {
            if (this.checked) {
                results.classList.remove("hide-deprecated");
            } else {
                results.classList.add("hide-deprecated");
            }
        });
    }
});
