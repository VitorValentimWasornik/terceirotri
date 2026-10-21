import express from 'express';
import cors from 'cors';
import 'dotenv/config';
const app = express()
process.env.NODE_TLS_REJECT_UNAUTHORIZED= '0'

const MODELO='openai/gpt-oss-120b'
const PORT = process.env.PORT || 5500;
const URL_API = "https://api.groq.com/openai/v1/chat/completions";

app.use(express.json());
app.use(express.static('public'));
app.use(cors());

const user = [];

app.get('/', (req, res)=>{
    return res.json(user);
})

app.post('/cadastro', (req, res)=>{
    const {usuario, email, senha} = req.body;

    if (!usuario || !email || !senha) {
        return res.status(400).json({
            erro: "Preencha todos os campos"
        });
    }

    if (senha.length < 6) {
        return res.status(400).json({
            erro: "A senha deve ter 6 caracteres ou mais"
        });
    }

    const emailUsado = user.find((busca) => busca.email === email);

    if (emailUsado) {
        return res.status(409).json({
            erro: "Email já está em uso"
        });
    }

    console.log(`Recebido, aguarde 5 segundo`);

    user.push({usuario, email, senha});

    setTimeout(()=>{
        console.log(`Cadastrado o ${usuario} com o Email ${email}`);

        res.json({
            mensagem: "Cadastrado com Sucesso!!",
            perfil: `Perfil ${usuario} cadastrado com o email ${email}`
        });
    }, 5000);
});

app.post('/login', (req, res)=>{
    const {email, senha} = req.body;
    
    if (!email || !senha) {
        return res.status(400).json({erro:"Preencha todos os campos"});
    }

    const emailExiste = user.find((busca)=> busca.email.toLowerCase() === email.toLowerCase());

    if (!emailExiste || emailExiste.senha != senha) {
        return res.status(400).json({erro:"Email ou senha incorretos!"});
    }

    return res.json({
        mensagem: "Login realizado com Sucesso!!",
        usuario: emailExiste.email
    });
})

app.post('/chat', async (req, res) => {
    try {
        const API_KEY = process.env.GROQ_API_KEY;
        const historico = req.body.historico || [];

        const persona = {
            role: "system",
            content: `Você é um personagem de chat inspirado no cantor e compositor brasileiro Jorge Ben Jor, criador do samba rock.

Você conversa com o usuário sobre a vida e a obra do Jorge Ben Jor, samba rock, MPB, seus discos, suas músicas, a música brasileira e a cultura carioca.

Estilo de resposta:
- Fale em português do Brasil, de forma curta, simpática, descontraída e cheia de molejo.
- Use um tom leve e alegre, com gírias cariocas leves, como "e aí, meu camarada" e "bora lá".
- Responda diretamente ao que o usuário perguntou, sem repetir sempre a mesma saudação.
- Se perguntarem sobre uma música ou um disco, fale especificamente sobre ele.
- Não invente fatos, datas, parcerias ou citações. Se não tiver certeza de algo, diga que não tem certeza.
- Não reproduza letras de músicas. Pode comentar o tema, o ritmo e a história delas com suas próprias palavras.
- Se o assunto fugir da música, responda brevemente e traga a conversa de volta para a música com leveza.
- Seja objetivo
`
        };

        const mensagens = [
            persona,
            ...historico
        ];

        const respostaJorge = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: mensagens
            })
        });

        const resultado = await respostaJorge.json();

        if (!respostaJorge.ok) {
            console.log(resultado);

            return res.status(500).json({
                erro: "Erro de comunicação com a GROQ"
            });
        }

        return res.json({
            resposta: resultado.choices[0].message.content
        });

    } catch (erro) {
        console.log(erro);

        return res.status(500).json({
            erro: "Falha interna da GROQ"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});