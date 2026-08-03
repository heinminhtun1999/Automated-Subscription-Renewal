// const form = document.querySelector("form");
// const errorEl = document.querySelector("#error-text");

// form.addEventListener("submit", async (e) => {

//     errorEl.textContent = "";
//     errorEl.classList.add("hidden");

//     e.preventDefault()
//     const formData = new FormData(form);
//     const data = Object.fromEntries(formData);

//     try {
//         const response = await fetch("/admin/login", {
//             headers: {
//                 'Content-Type': 'application/json'
//             },
//             method: 'POST',
//             body: JSON.stringify(data)
//         });

//         const result = await response.json();

//         if (!result.success) {
//             throw new Error(result.error)
//         }

//     } catch (e) {
//         errorEl.textContent = e.message
//         errorEl.classList.remove('hidden');
//     }
// });