package br.mackenzie.adocao;

import static br.mackenzie.adocao.SolicitacaoAdocao.Status.*;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class SolicitacaoAdocaoTest {

    private final Pet rex = new Pet("Rex", "cachorro");
    private final Pet mia = new Pet("Mia", "gato");

    @Test
    void novaSolicitacaoComecaPendente() {
        // Caso 1: adotante exatamente com a idade mínima
        SolicitacaoAdocao s1 = new SolicitacaoAdocao(rex, "Ana", 18);
        assertEquals(PENDENTE, s1.getStatus());

        // Caso 2: outro pet e adotante mais velho
        SolicitacaoAdocao s2 = new SolicitacaoAdocao(mia, "Carlos", 40);
        assertEquals(PENDENTE, s2.getStatus());
    }

    @Test
    void aprovarSolicitacaoPendente() {
        SolicitacaoAdocao s = new SolicitacaoAdocao(rex, "Ana", 25);

        // Caso 1: aprovar uma solicitação pendente
        s.aprovar();
        assertEquals(APROVADA, s.getStatus());

        // Caso 2: aprovar de novo não é permitido
        assertThrows(IllegalStateException.class, s::aprovar);
    }

    @Test
    void recusarSolicitacaoPendente() {
        SolicitacaoAdocao s = new SolicitacaoAdocao(mia, "Bruno", 30);

        // Caso 1: recusar uma solicitação pendente
        s.recusar();
        assertEquals(RECUSADA, s.getStatus());

        // Caso 2: recusar de novo não é permitido
        assertThrows(IllegalStateException.class, s::recusar);
    }

    @Test
    void naoPermiteMudarDecisaoJaTomada() {
        // Caso 1: solicitação aprovada não pode ser recusada
        SolicitacaoAdocao aprovada = new SolicitacaoAdocao(rex, "Ana", 25);
        aprovada.aprovar();
        assertThrows(IllegalStateException.class, aprovada::recusar);

        // Caso 2: solicitação recusada não pode ser aprovada
        SolicitacaoAdocao recusada = new SolicitacaoAdocao(mia, "Bruno", 30);
        recusada.recusar();
        assertThrows(IllegalStateException.class, recusada::aprovar);
    }

    @Test
    void menorDeIdadeNaoPodeSolicitar() {
        // Caso 1: um ano abaixo do limite
        assertThrows(IllegalArgumentException.class,
                () -> new SolicitacaoAdocao(rex, "Joao", 17));

        // Caso 2: criança
        assertThrows(IllegalArgumentException.class,
                () -> new SolicitacaoAdocao(mia, "Pedro", 10));
    }

    @Test
    void guardaDadosDaSolicitacao() {
        // Caso 1: primeira solicitação
        SolicitacaoAdocao s1 = new SolicitacaoAdocao(rex, "Ana", 25);
        assertEquals("Ana", s1.getNomeAdotante());
        assertEquals("Rex", s1.getPet().getNome());

        // Caso 2: segunda solicitação, com dados diferentes
        SolicitacaoAdocao s2 = new SolicitacaoAdocao(mia, "Carlos", 40);
        assertEquals("Carlos", s2.getNomeAdotante());
        assertEquals("Mia", s2.getPet().getNome());
    }
}
