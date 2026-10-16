package br.mackenzie.adocao;

public class Pet {

    private final String nome;
    private final String especie;

    public Pet(String nome, String especie) {
        this.nome = nome;
        this.especie = especie;
    }

    public String getNome() {
        return nome;
    }

    public String getEspecie() {
        return especie;
    }
}
