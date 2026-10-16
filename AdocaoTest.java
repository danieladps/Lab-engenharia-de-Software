package br.mackenzie.adocao;

import static org.junit.jupiter.api.Assertions.*;

import java.util.List;
import org.junit.jupiter.api.Test;

class AdocaoTest {

    @Test
    void maiorDeIdadePodeAdotar() {
        assertTrue(Adocao.podeAdotar(18));
    }

    @Test
    void menorDeIdadeNaoPodeAdotar() {
        assertFalse(Adocao.podeAdotar(17));
    }

    @Test
    void filtraPetsPorEspecie() {
        List<Pet> pets = List.of(
                new Pet("Rex", "cachorro"),
                new Pet("Mia", "gato"),
                new Pet("Bob", "Cachorro"));

        assertEquals(2, Adocao.filtrarPorEspecie(pets, "cachorro").size());
    }
}
