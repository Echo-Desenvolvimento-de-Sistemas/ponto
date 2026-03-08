<?php
$user = App\Models\User::where('role', 'funcionario')->first();
App\Models\RegistroPonto::create([
    'user_id' => $user->id,
    'empresa_id' => $user->empresa_id,
    'tipo' => 'entrada',
    'horario_dispositivo' => '2026-03-01 22:00:00',
    'horario_servidor' => '2026-03-01 22:00:00',
    'status' => 'aprovado_manual',
    'metodo_autenticacao' => 'gps'
]);
App\Models\RegistroPonto::create([
    'user_id' => $user->id,
    'empresa_id' => $user->empresa_id,
    'tipo' => 'saida',
    'horario_dispositivo' => '2026-03-02 06:00:00',
    'horario_servidor' => '2026-03-02 06:00:00',
    'status' => 'aprovado_manual',
    'metodo_autenticacao' => 'gps'
]);
echo "Night shift points added successfully.\n";
