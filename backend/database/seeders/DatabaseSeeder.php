<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Empresa;
use App\Models\Geofence;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Cria Empresa de Teste
        $empresa = Empresa::create([
            'nome_fantasia' => 'Tech Corp Ponto',
            'razao_social' => 'Tech Corp Ponto SaaS Ltda',
            'cnpj' => '00000000000100',
        ]);

        // Cria Cerca Virtual de Teste na Avenida Paulista (Exemplo SP)
        Geofence::create([
            'empresa_id' => $empresa->id,
            'nome' => 'Sede Principal (Av. Paulista)',
            'latitude' => -23.561414,
            'longitude' => -46.656400,
            'raio_metros' => 500,
        ]);

        // 1. Admin Global do SaaS
        User::create([
            'name' => 'Admin SaaS Full',
            'email' => 'admin@pontonow.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin_global',
        ]);

        // 2. RH da Empresa Tech Corp
        User::create([
            'empresa_id' => $empresa->id,
            'name' => 'Gestor do RH',
            'email' => 'rh@techcorp.com',
            'password' => Hash::make('admin123'),
            'role' => 'empresa_rh',
        ]);

        // 3. Funcionário Comum da Tech Corp
        $funcionario = User::create([
            'empresa_id' => $empresa->id,
            'name' => 'João Silva (Funcionário)',
            'email' => 'joao@techcorp.com',
            'password' => Hash::make('senha123'),
            'role' => 'funcionario',
        ]);

        $funcionario->detalhes()->create([
            'cpf' => '111.222.333-44',
            'matricula' => 'EMP-001'
        ]);
    }
}
