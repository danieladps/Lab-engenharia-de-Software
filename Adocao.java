package br.mackenzie.adocao;

import java.util.List;
import java.util.stream.Collectors;

public class Adocao {

    public static final int IDADE_MINIMA_ADOTANTE = 18;

    public static boolean podeAdotar(int idadeAdotante) {
        return idadeAdotante >= IDADE_MINIMA_ADOTANTE;
    }

    public static List<Pet> filtrarPorEspecie(List<Pet> pets, String especie) {
        return pets.stream()
                .filter(p -> p.getEspecie().equalsIgnoreCase(especie))
                .collect(Collectors.toList());
    }
}
