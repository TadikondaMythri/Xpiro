// signin.js
document.getElementById("signinForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("https://xpiro.onrender.com/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (res.ok) {
        if (data.token) localStorage.setItem("token", data.token);
        localStorage.setItem("loggedIn", "true");

        alert("✅ Login successful!");
        window.location.href = "dashboard.html";
        } else {
        alert(data.message || "❌ Login failed");
        }
    } catch (err) {
        console.error("Signin error:", err);
        alert("⚠️ Something went wrong. Check your server.");
    }
});
