<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('ocorrencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('empresa_id')->constrained('empresas')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('tipo'); // 'esquecimento_entrada', 'esquecimento_saida', 'falta_justificada', 'atestado'
            $table->date('data_ocorrencia');
            $table->time('horario_sugerido')->nullable(); // Para ajustes de esquecimento
            $table->text('justificativa')->nullable(); // Explicação do colaborador
            $table->string('anexo_url')->nullable(); // Para fotos de atestados
            $table->string('status')->default('pendente'); // 'pendente', 'aprovada', 'rejeitada'
            $table->foreignId('avaliador_id')->nullable()->constrained('users')->onDelete('set null'); // Quem julgou
            $table->text('observacao_gestor')->nullable(); // Justificativa da Aprovação/Rejeição
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('ocorrencias');
    }
};
