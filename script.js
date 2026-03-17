const MASTER_PASSWORD = "varketiliadmin";

// 1. DATA SOURCE
// INITIAL_BOOKS comes from your data.js file
let books = typeof INITIAL_BOOKS !== 'undefined' ? [...INITIAL_BOOKS] : [];

document.addEventListener('DOMContentLoaded', () => {
    const adminBtn = document.getElementById('adminBtn');
    const adminSection = document.getElementById('adminSection');
    const bookGrid = document.getElementById('bookGrid');
    const searchInput = document.getElementById('searchInput');
    const bookModal = document.getElementById('bookModal');
    const saveBookBtn = document.getElementById('saveBookBtn');

    // --- 2. RENDER FUNCTION ---
    function renderBooks(filter = "") {
        if (!bookGrid) return;
        bookGrid.innerHTML = '';

        const filtered = books.filter(b => 
            b.title.toLowerCase().includes(filter.toLowerCase()) || 
            b.author.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            bookGrid.innerHTML = `<div class="col-span-full text-center py-40 uppercase text-zinc-300 font-extrabold tracking-[1em] text-sm">Catalogue Empty</div>`;
            return;
        }

        filtered.forEach((book, index) => {
            const isAdmin = !adminSection.classList.contains('hidden');
            const card = document.createElement('div');
            card.className = "group cursor-pointer";
            
            card.innerHTML = `
                <div class="aspect-[10/14] overflow-hidden rounded-[2.5rem] bg-zinc-100 shadow-xl transition-all duration-500 group-hover:-translate-y-2">
                    <img src="${book.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" onerror="this.src='https://via.placeholder.com/600x800?text=Cover+Missing'">
                </div>
                <div class="mt-6 flex justify-between items-start">
                    <div>
                        <h3 class="font-extrabold text-lg tracking-tight leading-tight">${book.title}</h3>
                        <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mt-1">${book.author}</p>
                    </div>
                    <span class="font-bold text-lg text-black">${book.price}₾</span>
                </div>
                ${isAdmin ? `
                    <button onclick="event.stopPropagation(); window.deleteBook(${index})" class="mt-4 text-[9px] font-black uppercase text-red-500 hover:underline tracking-tighter">Remove Permanently</button>
                ` : ''}
            `;
            
            card.onclick = () => openModal(book);
            bookGrid.appendChild(card);
        });
    }

    // --- 3. ADMIN ACCESS CONTROL ---
    if (adminBtn) {
        adminBtn.onclick = () => {
            if (adminSection.classList.contains('hidden')) {
                const pass = prompt("Admin Key:");
                if (pass === MASTER_PASSWORD) {
                    adminSection.classList.remove('hidden');
                    adminBtn.innerText = "Close Admin";
                    renderBooks();
                } else if (pass !== null) {
                    alert("Unauthorized");
                }
            } else {
                adminSection.classList.add('hidden');
                adminBtn.innerText = "Admin Control";
                renderBooks();
            }
        };
    }

    // --- 4. THE "SAVE TO GITHUB" FUNCTION ---
    if (saveBookBtn) {
        saveBookBtn.onclick = function() {
            const title = document.getElementById('bookTitle').value;
            const author = document.getElementById('bookAuthor').value;
            const price = document.getElementById('bookPrice').value;
            const desc = document.getElementById('bookDesc').value;
            const fileInput = document.getElementById('bookImgFile');

            if (title && price && fileInput.files[0]) {
                const reader = new FileReader();
                saveBookBtn.innerText = "Processing Image...";
                saveBookBtn.disabled = true;

                reader.onload = async function(e) {
                    // Update local list
                    const updatedList = [{
                        title, author, price, description: desc, image: e.target.result
                    }, ...books];

                    saveBookBtn.innerText = "Updating GitHub Repo...";

                    try {
                        // Call Netlify Function
                        const response = await fetch('/.netlify/functions/save', {
                            method: 'POST',
                            body: JSON.stringify({ newBooks: updatedList })
                        });

                        if (response.ok) {
                            alert("Success! Book saved to GitHub. Site will update in ~30 seconds.");
                            location.reload(); 
                        } else {
                            throw new Error("Failed to save to GitHub");
                        }
                    } catch (err) {
                        alert("Error: " + err.message);
                        saveBookBtn.innerText = "Add to Storefront";
                        saveBookBtn.disabled = false;
                    }
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                alert("Please fill Title, Price, and Photo.");
            }
        };
    }

    // --- 5. SEARCH LOGIC ---
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderBooks(e.target.value));
    }

    // --- 6. MODAL LOGIC ---
    function openModal(book) {
        document.getElementById('modalImg').src = book.image;
        document.getElementById('modalTitle').innerText = book.title;
        document.getElementById('modalAuthor').innerText = book.author;
        document.getElementById('modalPrice').innerText = `${book.price} GEL`;
        document.getElementById('modalDesc').innerText = book.description;
        bookModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    document.getElementById('closeModal').onclick = () => {
        bookModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    };

    // --- 7. GLOBAL DELETE ---
    window.deleteBook = async (i) => {
        if (confirm("Permanently delete this book from GitHub?")) {
            const updatedList = [...books];
            updatedList.splice(i, 1);

            try {
                const response = await fetch('/.netlify/functions/save', {
                    method: 'POST',
                    body: JSON.stringify({ newBooks: updatedList })
                });

                if (response.ok) {
                    alert("Deleted! Site is rebuilding.");
                    location.reload();
                }
            } catch (err) {
                alert("Error deleting: " + err.message);
            }
        }
    };

    // Initial load
    renderBooks();
});