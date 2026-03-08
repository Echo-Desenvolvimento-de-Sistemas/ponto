<!DOCTYPE html>
<html lang="pt-br">

<head>
    <meta charset="UTF-8">
    <title>Relatório Gerencial - {{ $periodo }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 40px;
        }

        .header {
            border-bottom: 2px solid #a855f7;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #a855f7;
        }

        .title {
            text-align: right;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 40px;
        }

        .metric-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
            text-align: center;
        }

        .metric-value {
            font-size: 28px;
            font-weight: bold;
            color: #a855f7;
            margin-top: 10px;
        }

        .metric-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            background: #f3f4f6;
            text-align: left;
            padding: 12px;
            border-bottom: 2px solid #e5e7eb;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }

        .chart-placeholder {
            height: 200px;
            background: #f3f4f6;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 10px;
            margin-bottom: 30px;
            color: #9ca3af;
        }

        @media print {
            .no-print {
                display: none;
            }
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">PontoNow</div>
        <div class="title">
            <h1>Relatório de Gestão RH</h1>
            <p>Período: {{ $periodo }}</p>
        </div>
    </div>

    <div class="metrics-grid">
        <div class="metric-card">
            <div class="metric-label">Funcionários</div>
            <div class="metric-value">{{ $metrics->total_funcionarios }}</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Absenteísmo</div>
            <div class="metric-value">{{ $metrics->absenteismo }}%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Presença Média</div>
            <div class="metric-value">{{ $metrics->presenca }}%</div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Horas Extras</div>
            <div class="metric-value">{{ $metrics->horas_extras_total }}</div>
        </div>
    </div>

    <h2>Análise de Frequência</h2>
    <div class="chart-placeholder">
        [ Gráfico de Engajamento Ocupacional ]
    </div>

    <h2>Top 5 Atrasos do Mês</h2>
    <table>
        <thead>
            <tr>
                <th>Colaborador</th>
                <th>Total Atraso</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($ranking_atrasos as $rank)
                <tr>
                    <td>{{ $rank->nome }}</td>
                    <td>{{ floor($rank->minutos / 60) }}h {{ $rank->minutos % 60 }}min</td>
                    <td><span style="color: #ef4444;">● Crítico</span></td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div style="margin-top: 50px; text-align: center;" class="no-print">
        <button onclick="window.print()"
            style="padding: 10px 20px; background: #a855f7; color: white; border: none; border-radius: 5px; cursor: pointer;">
            Gerar PDF (Imprimir)
        </button>
    </div>
</body>

</html>