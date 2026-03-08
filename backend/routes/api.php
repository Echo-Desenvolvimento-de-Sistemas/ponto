<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;

use App\Http\Controllers\API\EmpresaController;
use App\Http\Controllers\API\FuncionarioController;
use App\Http\Controllers\API\GeofenceController;
use App\Http\Controllers\API\RegistroPontoController;
use App\Http\Controllers\API\ExportController;
use App\Http\Controllers\API\DashboardController;
use App\Http\Controllers\API\ConviteController;
use App\Http\Controllers\API\SetupColaboradorController;
use App\Http\Controllers\API\WhiteLabelController;
use App\Http\Controllers\API\OcorrenciaController;
use App\Http\Controllers\API\JornadaTrabalhoController;
use App\Http\Controllers\API\RelatorioController;
use App\Http\Controllers\API\RelatorioBIController;
use App\Http\Controllers\API\AuditController;
use App\Http\Controllers\API\MinhaJornadaController;
use App\Http\Controllers\API\PasswordResetTicketController;
use App\Http\Controllers\API\ManagementReportController;
use App\Http\Controllers\API\FacialEnrollmentController;
use App\Http\Controllers\API\PushNotificationController;

Route::post('/login', [AuthController::class, 'login']);

// Public Invitation endpoints
Route::get('/convites/{token}/validar', [ConviteController::class, 'validar']);
Route::post('/convites/{token}/aceitar', [ConviteController::class, 'aceitar']);

// Public Colaborador Setup
Route::get('/colaborador/setup/{token}', [SetupColaboradorController::class, 'validar']);
Route::post('/colaborador/setup/{token}', [SetupColaboradorController::class, 'aceitar']);

// Public Whitelabel
Route::get('/whitelabel', [WhiteLabelController::class, 'index']);

// Public Password Reset Ticket
Route::post('/password-reset-ticket', [PasswordResetTicketController::class, 'store']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/change-password-forced', [AuthController::class, 'changePasswordForced']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::get('/minha-jornada', [MinhaJornadaController::class, 'index']);

    Route::post('/migracao/preview', [\App\Http\Controllers\API\MigracaoController::class, 'preview']);
    Route::post('/migracao/importar', [\App\Http\Controllers\API\MigracaoController::class, 'importar']);

    Route::apiResource('empresas', EmpresaController::class);
    Route::post('/convites/gerar', [ConviteController::class, 'gerar']);
    Route::post('/funcionarios/{id}/force-password-reset', [FuncionarioController::class, 'forcePasswordReset']);
    Route::apiResource('funcionarios', FuncionarioController::class);
    Route::apiResource('geofences', GeofenceController::class);
    Route::apiResource('jornadas', JornadaTrabalhoController::class);
    Route::get('registro-pontos/resumo', [RegistroPontoController::class, 'resumo']);
    Route::get('registro-pontos/resumo-mensal', [RegistroPontoController::class, 'resumoMensal']);
    Route::get('registro-pontos/justificativas', [RegistroPontoController::class, 'justificativasPendentes']);
    Route::put('registro-pontos/{id}/justificativa', [RegistroPontoController::class, 'avaliarJustificativa']);
    Route::get('registro-pontos/{id}/comprovante', [RegistroPontoController::class, 'comprovante']);
    Route::apiResource('registro-pontos', RegistroPontoController::class)->only(['index', 'store']);

    Route::get('/dashboard/metrics', [DashboardController::class, 'index']);

    // Relatórios e Compliance
    Route::post('/export/afd', [ExportController::class, 'exportAfd']);
    Route::get('/export/folha', [ExportController::class, 'exportFolha']);
    Route::get('/relatorios/gerencial', [RelatorioController::class, 'absenteismo']); // Reusing logic
    Route::get('/relatorios/gerencial/dados', [ManagementReportController::class, 'index']);
    Route::get('/relatorios/gerencial/pdf', [ManagementReportController::class, 'exportPdf']);
    Route::get('/relatorios/absenteismo', [RelatorioController::class, 'absenteismo']);
    Route::get('/relatorios/espelho/{id}', [RelatorioController::class, 'espelho']);
    Route::post('/relatorios/espelho/{id}/assinar', [RelatorioController::class, 'assinarEspelho']);

    // BI Analítico
    Route::get('/bi/dashboard', [RelatorioBIController::class, 'index']);
    Route::get('/auditoria', [AuditController::class, 'index']);

    Route::post('/whitelabel', [WhiteLabelController::class, 'store']);

    // Reconhecimento Facial
    Route::post('/facial-enrollment', [FacialEnrollmentController::class, 'store']);
    Route::get('/facial-status', [FacialEnrollmentController::class, 'status']);

    // Ocorrências e Atestados
    Route::get('/ocorrencias', [OcorrenciaController::class, 'index']);
    Route::post('/ocorrencias', [OcorrenciaController::class, 'store']);
    Route::post('/ocorrencias/{id}/avaliar', [OcorrenciaController::class, 'avaliar']);
    // Notificações Push
    Route::post('/push-subscribe', [PushNotificationController::class, 'subscribe']);
    Route::post('/push-unsubscribe', [PushNotificationController::class, 'unsubscribe']);
});
