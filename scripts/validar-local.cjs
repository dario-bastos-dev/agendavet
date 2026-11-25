// Verificação local da referência de estudo; não gera evidências de autoria.
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'evidencias', 'local', new Date().toISOString().replace(/[:.]/g, '-'));
fs.mkdirSync(dir, {recursive: true});
const results = [];
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(label, cmd, args) {
  if (process.platform === 'win32' && cmd === npm) {
    // Os argumentos npm são definidos neste script, sem entrada externa.
    args = ['/d', '/c', [cmd, ...args].join(' ')];
    cmd = 'cmd.exe';
  }
  const r = spawnSync(cmd, args, {cwd: root, encoding: 'utf8', timeout: 300000, maxBuffer: 16 * 1024 * 1024});
  const output = (r.stdout || '') + '\n' + (r.stderr || '') + '\n' + (r.error ? String(r.error) : '') + '\nCódigo de saída: ' + r.status + '\n';
  fs.writeFileSync(path.join(dir, label + '.txt'), output);
  const ok = r.status === 0;
  results.push([label, ok ? 'APROVADO' : 'FALHOU']);
  console.log(label + ': ' + results.at(-1)[1]);
  return r;
}
function pending(label, reason) { results.push([label, 'PENDENTE: ' + reason]); }
async function main() {
  const installed = run('instalacao', npm, ['ci', '--no-audit', '--no-fund']).status === 0;
  const stages = [['demonstracao','dev:parte1'], ['nucleo','check:core'], ['compilacao','build'], ['jest','test'], ['cobertura','test:coverage']];
  if (installed) {
    for (const [label, script] of stages) {
      if (label === 'cobertura') fs.rmSync(path.join(root,'coverage','coverage-summary.json'), {force:true});
      const args = ['run', script];
      if (label === 'jest' || label === 'cobertura') args.push('--', '--runInBand', '--silent');
      run(label, npm, args);
    }
    const coverage = path.join(root,'coverage','coverage-summary.json');
    if (fs.existsSync(coverage)) {
      fs.copyFileSync(coverage,path.join(dir,'coverage-summary.json'));
      const report = JSON.parse(fs.readFileSync(coverage,'utf8'));
      for (const folder of ['pricing','facade']) {
        const files = Object.entries(report).filter(([name]) => name.replace(/\\/g,'/').includes('/src/'+folder+'/'));
        const total = files.reduce((sum,[,data]) => sum + data.branches.total,0);
        const covered = files.reduce((sum,[,data]) => sum + data.branches.covered,0);
        results.push(['branches '+folder, total ? `${(100*covered/total).toFixed(2)}% (${covered}/${total})` : 'não medido']);
      }
    } else pending('percentuais de branches','relatório não gerado');
  } else for (const [label] of stages) pending(label,'instalação falhou');
  if (process.argv.includes('--docker')) {
    if (run('docker-info','docker',['info']).status === 0 && run('docker-build','docker',['build','-t','agendavet','.']).status === 0) {
      const name = 'agendavet-validacao-' + process.pid;
      if (run('docker-run','docker',['run','--rm','-d','--name',name,'-p','127.0.0.1:3000:3000','agendavet']).status === 0) {
        try {
          let success = false, detail = '';
          for (let i=0;i<20;i++) {
            try { const res = await fetch('http://127.0.0.1:3000/consultas',{signal:AbortSignal.timeout(1000)}); const body=await res.json(); detail=JSON.stringify({status:res.status,body}); if (res.status===200 && Array.isArray(body)) {success=true;break;} } catch (err) {detail=String(err);}
            await new Promise(resolve=>setTimeout(resolve,500));
          }
          fs.writeFileSync(path.join(dir,'docker-http.txt'),detail+'\n');
          results.push(['Docker GET /consultas',success?'APROVADO':'FALHOU']);
          run('docker-logs','docker',['logs',name]);
        } finally {run('docker-stop','docker',['stop',name]);}
      } else pending('Docker GET /consultas','container não iniciou');
    } else pending('Docker GET /consultas','Docker indisponível ou build falhou');
  } else results.push(['Docker', 'NÃO SOLICITADO: execute com --docker']);
}
main().catch(err=>{results.push(['validação','FALHOU: '+String(err)]);}).finally(()=>{
  const summary = ['# Resultados da execução local', '', 'Data: '+new Date().toISOString(), '', '| Etapa | Resultado |', '|---|---|', ...results.map(([a,b])=>'| '+a+' | '+b.replace(/\|/g,'/')+' |'), '', 'Este relatório não comprova autoria nem atividades acadêmicas presenciais.'].join('\n');
  fs.writeFileSync(path.join(dir,'RESUMO.md'),summary+'\n');
  console.log('\nRelatório: '+path.join(dir,'RESUMO.md'));
  if(results.some(([,r])=>r.startsWith('FALHOU') || r.startsWith('PENDENTE'))) process.exitCode=1;
});
