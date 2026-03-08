<?php

use App\Models\FuncionarioDetalhe;

$detalhe = FuncionarioDetalhe::where('cpf', '0783394467')->first();
$user = $detalhe ? $detalhe->user : null;
if ($user) {
    echo "User ID: {$user->id}, Email: {$user->email}, Role: {$user->role}\n";
    $matched = Hash::check('password', $user->password) ? 'YES' : 'NO';
    echo "Password matches 'password': $matched\n";
} else {
    echo "User not found\n";
}
