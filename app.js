// --- HOMEPAGE SPECIFIC: Dynamic Membership Calculator ---
const planDurationSelector = document.getElementById('plan-duration');

if (planDurationSelector) {
    const baseAccessPrice = 3000;
    const baseElitePrice = 5000;

    planDurationSelector.addEventListener('change', (e) => {
        const months = parseInt(e.target.value);
        let discount = 1;

        if (months === 3) discount = 0.90;  // 10% off
        if (months === 12) discount = 0.75; // 25% off

        // Calculate and display dynamically modified values
        document.getElementById('access-price').innerText = Math.round(baseAccessPrice * months * discount).toLocaleString();
        document.getElementById('elite-price').innerText = Math.round(baseElitePrice * months * discount).toLocaleString();
    });
}

// --- ENROLLMENT PAGE SPECIFIC: Form Capture & Database Delivery Hook ---
const enrollmentForm = document.getElementById('enrollment-form');
const feedbackContainer = document.getElementById('form-feedback');

if (enrollmentForm) {
    enrollmentForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevents the traditional page reload

        // Collect inputs from client fields
        const userData = {
            name: document.getElementById('fullname').value,
            email: document.getElementById('email').value,
            tier: document.getElementById('membership-tier').value
        };

        // UI Feedback indicating an outbound transaction process
        feedbackContainer.className = "feedback-message";
        feedbackContainer.innerText = "Processing registration...";
        feedbackContainer.style.display = "block";

        try {
            /* DATABASE INTEGRATION LINK:
               Once your backend server (Node.js/Express) is configured, change the target 
               URL below to your local server endpoint (e.g., 'http://localhost:3000/api/enroll')
            */
            const response = await fetch('https://httpbin.org/post', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData) // Converts JavaScript objects into strict JSON data strings
            });

            if (response.ok) {
                feedbackContainer.className = "feedback-message success";
                feedbackContainer.innerText = `Success! Welcome to Apex Fit, ${userData.name}.`;
                enrollmentForm.reset(); // Empties input forms cleanly
            } else {
                throw new Error("Server transmission error.");
            }
        } catch (error) {
            feedbackContainer.className = "feedback-message error";
            feedbackContainer.innerText = "Error: Could not save enrollment data to server.";
            console.error("Database connection failure context: ", error);
        }
    });
}