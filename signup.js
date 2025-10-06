// signup.js
document.getElementById("signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
        const res = await fetch("https://xpiro.onrender.com/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        });

        const data = await res.json();

        if (res.ok) {
            if (data.token) localStorage.setItem("token", data.token);
            localStorage.setItem("loggedIn", "true");
            alert("✅ Signup successful! ");
            window.location.href = "dashboard.html";
        } else {
        alert(data.message || "❌ Signup failed");
        }
    } catch (err) {
        console.error("Signup error:", err);
        alert("⚠️ Something went wrong. Check your server.");
    }
});
