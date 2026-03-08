<?php
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TempSeeder extends Seeder
{
    public function run()
    {
        $user = DB::table('users')->where('role', 'funcionario')->first();
        if (!$user)
            return;

        $day = Carbon::now()->subDays(2);

        $registros = [
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'entrada', 'horario_servidor' => $day->copy()->setHour(8), 'horario_dispositivo' => $day->copy()->setHour(8), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't1', 'hash_comprovante' => 't1', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'saida', 'horario_servidor' => $day->copy()->setHour(10), 'horario_dispositivo' => $day->copy()->setHour(10), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't2', 'hash_comprovante' => 't2', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'entrada', 'horario_servidor' => $day->copy()->setHour(11), 'horario_dispositivo' => $day->copy()->setHour(11), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't3', 'hash_comprovante' => 't3', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'saida', 'horario_servidor' => $day->copy()->setHour(12), 'horario_dispositivo' => $day->copy()->setHour(12), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't4', 'hash_comprovante' => 't4', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'entrada', 'horario_servidor' => $day->copy()->setHour(13), 'horario_dispositivo' => $day->copy()->setHour(13), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't5', 'hash_comprovante' => 't5', 'created_at' => now(), 'updated_at' => now()],
            ['user_id' => $user->id, 'empresa_id' => $user->empresa_id, 'tipo' => 'saida', 'horario_servidor' => $day->copy()->setHour(18), 'horario_dispositivo' => $day->copy()->setHour(18), 'latitude' => 0, 'longitude' => 0, 'status' => 'valido', 'hash_afd' => 't6', 'hash_comprovante' => 't6', 'created_at' => now(), 'updated_at' => now()]
        ];

        DB::table('registro_pontos')->insert($registros);
    }
}
