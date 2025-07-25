import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDxgiQ-4FYw5WTKDKtMfs5wMnU4fKx5S58",
    authDomain: "roletafilmes.firebaseapp.com",
    projectId: "roletafilmes",
    storageBucket: "roletafilmes.firebasestorage.app",
    messagingSenderId: "971590963812",
    appId: "1:971590963812:web:917a7fed12dde15b190571"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const filmesColRef = collection(db, 'filmes');

window.db = db;
window.collection = collection;
window.onSnapshot = onSnapshot;

const canvas = document.getElementById("roleta");
const ctx = canvas.getContext("2d");
const btnGirart = document.getElementById("girar");
const resultado = document.getElementById("resultado");

const btnFilmes = document.getElementById("btnFilmes");
const modalFilmes = document.getElementById("modalFilmes");
const closeButton = document.querySelector(".close-button");
const inputNovoFilme = document.getElementById("inputNovoFilme");
const btnAddFilme = document.getElementById("btnAddFilme");
const listaFilmesModal = document.getElementById("listaFilmesModal");

let filmes = []; 

onSnapshot(filmesColRef, (snapshot) => {
    filmes = [];
    snapshot.forEach((doc) => {
        filmes.push({ id: doc.id, nome: doc.data().nome }); 
    });
    if (filmes.length > 0) {
        desenharRoleta();
    } else {
        resultado.textContent = "Nenhum filme encontrado no banco de dados Firestore.";
        ctx.clearRect(0, 0, 400, 400);
    }
    renderizarListaFilmesModal(); 
}, (error) => {
    console.error("Erro ao obter filmes do Firestore: ", error);
    resultado.textContent = "Erro ao carregar filmes. Verifique o console.";
});

function desenharRoleta() {
    if (filmes.length === 0) return;

    const total = filmes.length;
    const anguloPorSetor = (2 * Math.PI) / total;

    for (let i = 0; i < total; i++) {
        ctx.beginPath();
        ctx.moveTo(200, 200);
        ctx.arc(200, 200, 200, i * anguloPorSetor, (i + 1) * anguloPorSetor);
        ctx.fillStyle = i % 2 === 0 ? "#9b59b6" : "#6c3483";
        ctx.fill();

        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(i * anguloPorSetor + anguloPorSetor / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";

        let fontSize = 16;
        if (filmes[i].nome.length > 20) fontSize = 12;
        ctx.font = `${fontSize}px Arial`;

        function wrapText(text, maxChars) {
            const words = text.split(" ");
            const lines = [];
            let line = "";

            for (let word of words) {
                if ((line + word).length > maxChars) {
                    lines.push(line.trim());
                    line = word + " ";
                } else {
                    line += word + " ";
                }
            }
            lines.push(line.trim());
            return lines;
        }

        const lines = wrapText(filmes[i].nome, 15); 

        let offsetY = -(lines.length - 1) * 10;
        lines.forEach((line) => {
            ctx.fillText(line, 180, offsetY);
            offsetY += 20;
        });

        ctx.restore();
    }
}

let anguloAtual = 0;
let rodando = false;

function girar() {
    if (rodando || filmes.length === 0) return;
    rodando = true;
    resultado.textContent = "";

    let velocidade = Math.random() * 0.3 + 0.25;
    const desaceleracao = 0.995;

    const animar = () => {
        anguloAtual += velocidade;
        velocidade *= desaceleracao;

        ctx.clearRect(0, 0, 400, 400);
        ctx.save();
        ctx.translate(200, 200);
        ctx.rotate(anguloAtual);
        ctx.translate(-200, -200);
        desenharRoleta();
        ctx.restore();

        if (velocidade > 0.002) {
            requestAnimationFrame(animar);
        } else {
            rodando = false;
            mostrarResultado();
        }
    };

    animar();
}

function mostrarResultado() {
    const total = filmes.length;
    const anguloPorSetor = (2 * Math.PI) / total;

    let anguloFinal = (anguloAtual + Math.PI / 2) % (2 * Math.PI);

    if (anguloFinal < 0) anguloFinal += 2 * Math.PI;

    anguloFinal = 2 * Math.PI - anguloFinal;

    const index = Math.floor(anguloFinal / anguloPorSetor) % total;

    resultado.textContent = `O filme de hoje é "${filmes[index].nome}"`; 
}

btnGirart.addEventListener("click", girar);

btnFilmes.addEventListener("click", () => {
    modalFilmes.style.display = "block";
    renderizarListaFilmesModal(); 
});

closeButton.addEventListener("click", () => {
    modalFilmes.style.display = "none";
});

window.addEventListener("click", (event) => {
    if (event.target === modalFilmes) {
        modalFilmes.style.display = "none";
    }
});

function renderizarListaFilmesModal() {
    listaFilmesModal.innerHTML = "";
    if (filmes.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nenhum filme cadastrado.";
        listaFilmesModal.appendChild(li);
        return;
    }

    filmes.forEach((filme) => {
        const li = document.createElement("li");
        li.dataset.id = filme.id; 

        const spanNome = document.createElement("span");
        spanNome.textContent = filme.nome;
        li.appendChild(spanNome);

        const divBotoes = document.createElement("div");
        divBotoes.classList.add("botoes-acao");

        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.classList.add("btn-editar");
        btnEditar.addEventListener("click", () => iniciarEdicaoFilme(filme.id, filme.nome, spanNome, li));
        divBotoes.appendChild(btnEditar);

        const btnExcluir = document.createElement("button");
        btnExcluir.textContent = "Excluir";
        btnExcluir.classList.add("btn-excluir");
        btnExcluir.addEventListener("click", () => excluirFilme(filme.id));
        divBotoes.appendChild(btnExcluir);

        li.appendChild(divBotoes);
        listaFilmesModal.appendChild(li);
    });
}

btnAddFilme.addEventListener("click", async () => {
    const nomeFilme = inputNovoFilme.value.trim();
    if (nomeFilme) {
        try {
            await addDoc(filmesColRef, { nome: nomeFilme });
            inputNovoFilme.value = ""; 
        } catch (e) {
            console.error("Erro ao adicionar filme: ", e);
            alert("Erro ao adicionar filme. Verifique o console.");
        }
    } else {
        alert("Por favor, digite o nome do filme.");
    }
});

async function excluirFilme(id) {
    if (confirm("Tem certeza que deseja excluir este filme?")) {
        try {
            const filmeDocRef = doc(db, 'filmes', id);
            await deleteDoc(filmeDocRef);
        } catch (e) {
            console.error("Erro ao excluir filme: ", e);
            alert("Erro ao excluir filme. Verifique o console.");
        }
    }
}

function iniciarEdicaoFilme(id, nomeAtual, spanElement, liElement) {
    document.querySelectorAll('#listaFilmesModal li.editing').forEach(item => {
        if (item !== liElement) {
            const currentSpan = item.querySelector('span:not(.edit-input)'); 
            const currentInput = item.querySelector('input.edit-input');
            const currentSaveBtn = item.querySelector('.btn-salvar');
            const currentCancelBtn = item.querySelector('.btn-cancelar');
            const currentEditBtn = item.querySelector('.btn-editar');
            const currentDeleteBtn = item.querySelector('.btn-excluir');

            if (currentSpan && currentInput) {
                currentSpan.style.display = 'block';
                currentInput.remove();
            }
            if (currentSaveBtn) currentSaveBtn.remove();
            if (currentCancelBtn) currentCancelBtn.remove();
            if (currentEditBtn) currentEditBtn.style.display = 'inline-block';
            if (currentDeleteBtn) currentDeleteBtn.style.display = 'inline-block';
            item.classList.remove('editing');
        }
    });

    liElement.classList.add("editing");
    spanElement.style.display = "none"; 

    const inputEdicao = document.createElement("input");
    inputEdicao.type = "text";
    inputEdicao.value = nomeAtual;
    inputEdicao.classList.add("edit-input"); 
    liElement.prepend(inputEdicao); 

    const divBotoes = liElement.querySelector(".botoes-acao");
    divBotoes.innerHTML = ""; 

    const btnSalvar = document.createElement("button");
    btnSalvar.textContent = "Salvar";
    btnSalvar.classList.add("btn-editar", "btn-salvar"); 
    btnSalvar.addEventListener("click", () => salvarEdicaoFilme(id, inputEdicao.value, liElement));
    divBotoes.appendChild(btnSalvar);

    const btnCancelar = document.createElement("button");
    btnCancelar.textContent = "Cancelar";
    btnCancelar.classList.add("btn-excluir", "btn-cancelar"); 
    btnCancelar.addEventListener("click", () => cancelarEdicaoFilme(spanElement, inputEdicao, liElement));
    divBotoes.appendChild(btnCancelar);

    inputEdicao.focus();
}

async function salvarEdicaoFilme(id, novoNome, liElement) {
    const nomeTrimmed = novoNome.trim();
    if (nomeTrimmed && nomeTrimmed !== "") {
        try {
            const filmeDocRef = doc(db, 'filmes', id);
            await updateDoc(filmeDocRef, { nome: nomeTrimmed });
            liElement.classList.remove("editing"); 
        } catch (e) {
            console.error("Erro ao atualizar filme: ", e);
            alert("Erro ao atualizar filme. Verifique o console.");
        }
    } else {
        alert("O nome do filme não pode ser vazio.");
        cancelarEdicaoFilme(liElement.querySelector('span:not(.edit-input)'), liElement.querySelector('.edit-input'), liElement);
    }
}

function cancelarEdicaoFilme(spanElement, inputElement, liElement) {
    spanElement.style.display = "block";
    inputElement.remove(); 
    liElement.classList.remove("editing"); 
    renderizarListaFilmesModal(); 
}
