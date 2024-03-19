import path from 'node:path'
import csvToJson from 'csvtojson';

type DomainScores = {
  motivation: number;
  wellbeing: number;
  satisfaction: number;
  social: number;
  purpose: number;
}

type ParsedCsv = {
}

const DALLE_DICTIONARY = (async function loadDalleFileNames() {
  const dallePath = path.resolve(__dirname, '../../../../static/all_prompts_flat.csv')
  const parsedCsv = await csvToJson().fromFile(dallePath)
  const formattedCsv = parsedCsv.reduce((acc) => ())
})()

export function getSanaaFileName(domainScores: DomainScores, userLevel: number) {
  const compressedCode = getCompressedSanaaCode(domainScores);
  const code = `${compressedCode}-${userLevel}`;
  return code;
}

export function getCompressedSanaaCode(domainScores: DomainScores) {

}
