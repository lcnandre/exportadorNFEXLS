var fs = require('fs');
var express= require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var json2csv = require('json2csv');
var jsonexport = require('jsonexport');

var CAMINHO = 'D:\\itay\\notas-xml';
var ARQUIVO_SAIDA = 'D:\\itay\\notas-xml\\saida.csv';
var COLUNAS = 'numeroNota,dataEmissao,nomeCliente,municipioCliente,valorICMSST,valorNota,Copo,valorCopo,510Nat,valor510Nat,510Gas,valor510Gas,1LMeio,valor1LMeio,5L,valor5L,10L,valor10L,20L,valor20L';
var PRODUTOS = {
    22: 'Copo',
    19: '510Nat',
    20: '510Gas',
    21: '1LMeio',
    23: '5L',
    24: '10L',
    27: '20L'
};

router.get('/', function(req, res, next) {
    res.end('ok');
    processarCaminho(res);
});

var converterDados = function(nota, res) {
    try {
        if (nota.hasOwnProperty('procEventoNFe')) {
            return undefined;
        }

        var retorno = {
            numeroNota: nota.nfeProc.NFe[0].infNFe[0].ide[0].nNF[0],
            dataEmissao: formatarData(nota.nfeProc.NFe[0].infNFe[0].ide[0].dhEmi[0]),
            nomeCliente: nota.nfeProc.NFe[0].infNFe[0].dest[0].xNome[0],
            municipioCliente: nota.nfeProc.NFe[0].infNFe[0].dest[0].enderDest[0].xMun[0],
            valorICMSST: nota.nfeProc.NFe[0].infNFe[0].total[0].ICMSTot[0].vST[0],
            valorNota: nota.nfeProc.NFe[0].infNFe[0].total[0].ICMSTot[0].vNF[0]
        };

        for(var i=0; i<Object.keys(PRODUTOS).length; i++) {
            var valor = '0';
            var quantidade = '0';

            if (PRODUTOS.hasOwnProperty(Object.keys(PRODUTOS)[i])) {
                var codigoProduto = Object.keys(PRODUTOS)[i];
                var nomeProduto = PRODUTOS[Object.keys(PRODUTOS)[i]];
                retorno[nomeProduto] = nota.nfeProc.NFe[0].infNFe[0].det[0].prod.filter(function(d) {
                    return d.cProd[0] === codigoProduto;
                })[0];

                if (retorno[nomeProduto]) {
                    quantidade = retorno[nomeProduto].qCom[0];
                    valor = retorno[nomeProduto].vProd[0];
                }

                retorno[nomeProduto] = quantidade;
                retorno['valor' + nomeProduto] = valor;
            }
        }

        return retorno;
    } catch(err) {
        console.trace(err);
        return undefined;
    }    
};

var criarArquivo = function() {
    var conteudo = ''+COLUNAS;

    fs.writeFile(ARQUIVO_SAIDA, conteudo, function(err) {
        if(err) {
            console.trace(err);
        }
    });
};

var gravarArquivo = function(conteudo) {
    fs.appendFile(ARQUIVO_SAIDA, conteudo, function(err) {
        if(err) {
            console.trace(err);
        }
    });
};

var processarCaminho = function() {
    var dadosArquivo = ''+COLUNAS;

    criarArquivo();

    fs.readdir(CAMINHO, function(err, nomes) {
        if (err) {
            console.trace(err);
            return;
        }

        for (var i=0;i<nomes.length; i++) {
            var nome = nomes[i];

            if (nome.indexOf('.xml') > - 1) {
                fs.readFile(CAMINHO + '\\' + nome, 'utf-8', function(err, conteudo) {
                    if (err) {
                        console.trace(err);
                    } else {
                        converterArquivo(conteudo, function(linha) {
                            dadosArquivo = '\r\n' + linha;
                            gravarArquivo(dadosArquivo);
                        });
                    }
                });
            }
        }
    });
};

var formatarData = function(data) {
    data = new Date(data);
    var dia = data.getDate();
    if (dia.toString().length == 1)
      dia = "0"+dia;
    var mes = data.getMonth()+1;
    if (mes.toString().length == 1)
      mes = "0"+mes;
    var ano = data.getFullYear();  
    return dia+"/"+mes+"/"+ano;
};

var converterArquivo = function(conteudo, callBack) {
    parseString(conteudo, function (err, resultado) {
        if (err) {
            console.trace(err);
        } else {
            if (!resultado) {
                return;
            }
            var convertido  = converterDados(resultado);
            if (convertido) {
                var colunas = COLUNAS.split(',');
                var csv = json2csv({ data: convertido, fields: colunas });
                csv = csv.substring(csv.indexOf('"valor20L"') + 10);
                csv = csv.substring(csv.indexOf('"'));
                callBack(csv);
            }
        }
    });
}

module.exports = router;