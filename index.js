import { writeFileSync, appendFileSync, readdirSync, readFileSync } from 'fs';
import { parseString } from 'xml2js';
import jsonexport from 'jsonexport';
import json2csv from 'json2csv';

const CAMINHO = 'notas';
const ARQUIVO_SAIDA = 'saida.csv';
const COLUNAS =
  'numeroNota,dataEmissao,nomeCliente,municipioCliente,valorICMSST,valorICMS,valorNota,Copo,valorCopo,510Nat,valor510Nat,510Gas,valor510Gas,1LMeio,valor1LMeio,5L,valor5L,10L,valor10L,20L,valor20L';
const PRODUTOS = {
  22: 'Copo',
  19: '510Nat',
  20: '510Gas',
  21: '1LMeio',
  23: '5L',
  24: '10L',
  27: '20L',
};

function converterDados(nota) {
  try {
    if (nota.hasOwnProperty('procEventoNFe')) {
      return undefined;
    }

    const retorno = {
      numeroNota: nota.nfeProc.NFe[0].infNFe[0].ide[0].nNF[0],
      dataEmissao: formatarData(nota.nfeProc.NFe[0].infNFe[0].ide[0].dhEmi[0]),
      nomeCliente: nota.nfeProc.NFe[0].infNFe[0].dest[0].xNome[0],
      municipioCliente:
        nota.nfeProc.NFe[0].infNFe[0].dest[0].enderDest[0].xMun[0],
      valorICMSST: nota.nfeProc.NFe[0].infNFe[0].total[0].ICMSTot[0].vST[0],
      valorICMS: nota.nfeProc.NFe[0].infNFe[0].total[0].ICMSTot[0].vICMS[0],
      valorNota: nota.nfeProc.NFe[0].infNFe[0].total[0].ICMSTot[0].vNF[0],
    };

    for (let i = 0; i < Object.keys(PRODUTOS).length; i++) {
      const valor = '0';
      const quantidade = '0';

      if (PRODUTOS.hasOwnProperty(Object.keys(PRODUTOS)[i])) {
        const codigoProduto = Object.keys(PRODUTOS)[i];
        const nomeProduto = PRODUTOS[Object.keys(PRODUTOS)[i]];
        retorno[nomeProduto] = nota.nfeProc.NFe[0].infNFe[0].det[0].prod.filter(
          function (d) {
            return d.cProd[0] === codigoProduto;
          }
        )[0];

        if (retorno[nomeProduto]) {
          quantidade = retorno[nomeProduto].qCom[0];
          valor = retorno[nomeProduto].vProd[0];
        }

        retorno[nomeProduto] = quantidade;
        retorno['valor' + nomeProduto] = valor;
      }
    }

    return retorno;
  } catch (err) {
    console.trace(err);
    return undefined;
  }
}

function criarArquivo() {
  const conteudo = '' + COLUNAS;
  writeFileSync(ARQUIVO_SAIDA, conteudo);
}

function gravarArquivo(conteudo) {
  appendFileSync(ARQUIVO_SAIDA, conteudo);
}

function processarCaminho() {
  const dadosArquivo = '' + COLUNAS;

  criarArquivo();
  const nomes = readdirSync(CAMINHO);

  for (let i = 0; i < nomes.length; i++) {
    const nome = nomes[i];

    if (nome.indexOf('.xml') > -1) {
      const conteudo = readFileSync(CAMINHO + '\\' + nome, 'utf-8');
      converterArquivo(conteudo, function (linha) {
        dadosArquivo = '\r\n' + linha;
        gravarArquivo(dadosArquivo);
      });
    }
  }
}

function formatarData(data) {
  data = new Date(data);
  const dia = data.getDate();
  if (dia.toString().length == 1) dia = '0' + dia;
  const mes = data.getMonth() + 1;
  if (mes.toString().length == 1) mes = '0' + mes;
  const ano = data.getFullYear();
  return dia + '/' + mes + '/' + ano;
};

function converterArquivo(conteudo, callBack) {
  parseString(conteudo, function (err, resultado) {
    if (err) {
      console.trace(err);
    } else {
      if (!resultado) {
        return;
      }
      const convertido = converterDados(resultado);
      if (convertido) {
        const colunas = COLUNAS.split(',');
        const csv = json2csv({ data: convertido, fields: colunas });
        csv = csv.substring(csv.indexOf('"valor20L"') + 10);
        csv = csv.substring(csv.indexOf('"'));
        callBack(csv);
      }
    }
  });
};

processarCaminho();
