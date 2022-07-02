// Um desenvolvedor tentou criar um projeto que consome a base de dados de filme do TMDB para criar um organizador de filmes, mas desistiu 
// pois considerou o seu código inviável. Você consegue usar typescript para organizar esse código e a partir daí aprimorar o que foi feito?

// A ideia dessa atividade é criar um aplicativo que: 
//    - Busca filmes
//    - Apresenta uma lista com os resultados pesquisados
//    - Permite a criação de listas de filmes e a posterior adição de filmes nela

// Todas as requisições necessárias para as atividades acima já estão prontas, mas a implementação delas ficou pela metade (não vou dar tudo de graça).
// Atenção para o listener do botão login-button que devolve o sessionID do usuário
// É necessário fazer um cadastro no https://www.themoviedb.org/ e seguir a documentação do site para entender como gera uma API key https://developers.themoviedb.org/3/getting-started/introduction

type Movie = {
    adult: boolean;
    backdrop_path: string | null;
    belongs_to_collection: null | object;
    budget: number;
    genres: object[];
    homepage: string | null;
    id: number;
    imdb_id: string | null;
    original_language: string;
    original_title: string;
    overview: string | null;
    popularity: number;
    poster_path: string | null;
    production_companies: object[];
    production_countries: object[]
}

type MovieSearch = {
    poster_path: string | null;
    adult: boolean;
    overview: string;
    release_date: string;
    genre_ids: number[];
    id: number;
    original_title: string;
    original_language: string;
    title: string;
    backdrop_path: string | null;
    popularity: number;
    vote_count: number;
    video: boolean;
    vote_average: number;
}

type SearchResult = {
    page: number;
    results: MovieSearch[];
    total_results: number;
    total_pages: number;
}

type CreateRequestTokenResult = {
    success: boolean;
    expires_at: string;
    request_token: string;
}

type CreateSessionResponse = {
    session_id: string;
}

let apiKey: string = 'bcf6a9cb3149d9cb23a5262680bcb948';
let requestToken: string = '';
let username: string = '';
let password: string = '';
let sessionId: string = '';
let listId: string = '7101979';

let loginButton = document.getElementById('login-button')! as HTMLButtonElement;
let searchButton = document.getElementById('search-button')! as HTMLButtonElement;
let searchContainer = document.getElementById('search-container')!;

loginButton?.addEventListener('click', async () => {
    await criarRequestToken();
    await logar();
    await criarSessao();
})

searchButton?.addEventListener('click', async () => {
    let lista = document.getElementById("lista");
    if (lista) {
        lista.outerHTML = "";
    }
    let query = (document.getElementById('search')! as HTMLInputElement).value;
    let listaDeFilmes = await procurarFilme(query);
    let ul = document.createElement('ul');
    ul.id = "lista"
    for (const item of listaDeFilmes.results) {
        let li = document.createElement('li');
        li.appendChild(document.createTextNode(item.original_title))
        ul.appendChild(li)
    }
    console.log(listaDeFilmes);
    searchContainer?.appendChild(ul);
})

function preencherSenha() {
    password = (document.getElementById('senha')! as HTMLInputElement).value;
    validateLoginButton();
}

function preencherLogin() {
    username = (document.getElementById('login')! as HTMLInputElement).value;
    validateLoginButton();
}

function preencherApi() {
    apiKey = (document.getElementById('api-key')! as HTMLInputElement).value;
    validateLoginButton();
}

function validateLoginButton() {
    if (password && username && apiKey) {
        loginButton.disabled = false;
    } else {
        loginButton.disabled = true;
    }
}

class HttpClient {
    static async get(url: string, method: string, body: any = null) {
        return new Promise((resolve, reject) => {
            let request = new XMLHttpRequest();
            request.open(method, url, true);

            request.onload = () => {
                if (request.status >= 200 && request.status < 300) {
                    resolve(JSON.parse(request.responseText));
                } else {
                    reject({
                        status: request.status,
                        statusText: request.statusText
                    })
                }
            }
            request.onerror = () => {
                reject({
                    status: request.status,
                    statusText: request.statusText
                })
            }

            if (body) {
                request.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                body = JSON.stringify(body);
            }
            request.send(body);
        })
    }
}

async function procurarFilme(query: string): Promise<SearchResult> {
    query = encodeURI(query)
    console.log(query)
    let result: SearchResult = await HttpClient.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`,
        "GET") as SearchResult
    return result
}

async function adicionarFilme(filmeId: number) {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/movie/${filmeId}?api_key=${apiKey}&language=en-US`,
        "GET")
    console.log(result);
}

async function criarRequestToken() {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/authentication/token/new?api_key=${apiKey}`,
        "GET") as CreateRequestTokenResult

    requestToken = result.request_token
}

async function logar() {
    await HttpClient.get(
        `https://api.themoviedb.org/3/authentication/token/validate_with_login?api_key=${apiKey}`,
        "POST",
        {
            username: `${username}`,
            password: `${password}`,
            request_token: `${requestToken}`
        }
    )
}

async function criarSessao() {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/authentication/session/new?api_key=${apiKey}&request_token=${requestToken}`,
        "GET") as CreateSessionResponse;

    sessionId = result.session_id;
}

async function criarLista(nomeDaLista: string, descricao: string) {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/list?api_key=${apiKey}&session_id=${sessionId}`,
        "POST",
        {
            name: nomeDaLista,
            description: descricao,
            language: "pt-br"
        }
    )
    console.log(result);
}

async function adicionarFilmeNaLista(filmeId: number, listaId: number) {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/list/${listaId}/add_item?api_key=${apiKey}&session_id=${sessionId}`,
        "POST",
        {
            media_id: filmeId
        }
    )
    console.log(result);
}

async function pegarLista() {
    let result = await HttpClient.get(
        `https://api.themoviedb.org/3/list/${listId}?api_key=${apiKey}`,
        "GET"
    )
    console.log(result);
}

{/* <div style="display: flex;">
  <div style="display: flex; width: 300px; height: 100px; justify-content: space-between; flex-direction: column;">
      <input id="login" placeholder="Login" onchange="preencherLogin(event)">
      <input id="senha" placeholder="Senha" type="password" onchange="preencherSenha(event)">
      <input id="api-key" placeholder="Api Key" onchange="preencherApi()">
      <button id="login-button" disabled>Login</button>
  </div>
  <div id="search-container" style="margin-left: 20px">
      <input id="search" placeholder="Escreva...">
      <button id="search-button">Pesquisar Filme</button>
  </div>
</div>*/}