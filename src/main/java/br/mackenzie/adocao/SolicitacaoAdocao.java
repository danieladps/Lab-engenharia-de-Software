package br.mackenzie.adocao;

public class SolicitacaoAdocao {

    public enum Status {
        PENDENTE,
        APROVADA,
        RECUSADA
    }

    private final Pet pet;
    private final String nomeAdotante;
    private Status status;

    public SolicitacaoAdocao(Pet pet, String nomeAdotante, int idadeAdotante) {
        if (!Adocao.podeAdotar(idadeAdotante)) {
            throw new IllegalArgumentException("Adotante precisa ter pelo menos "
                    + Adocao.IDADE_MINIMA_ADOTANTE + " anos.");
        }
        this.pet = pet;
        this.nomeAdotante = nomeAdotante;
        this.status = Status.PENDENTE;
    }

    public void aprovar() {
        validarPendente();
        this.status = Status.APROVADA;
    }

    public void recusar() {
        validarPendente();
        this.status = Status.RECUSADA;
    }

    private void validarPendente() {
        if (status != Status.PENDENTE) {
            throw new IllegalStateException("Solicitação já foi " + status + ".");
        }
    }

    public Pet getPet() {
        return pet;
    }

    public String getNomeAdotante() {
        return nomeAdotante;
    }

    public Status getStatus() {
        return status;
    }
}
