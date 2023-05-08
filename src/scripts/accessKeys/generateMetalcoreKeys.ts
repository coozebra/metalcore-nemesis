import fs from 'fs/promises';
import { parse, Parser } from 'csv-parse';

const main = async () => {
  const path = 'keys.csv';
  const input = await fs.readFile(path, 'utf-8');
  const indentationSpace = 2;
  const metalcoreGameId = '62e4237a76500684f248480b';

  const table: Parser = parse(input, {
    columns: true,
    skip_empty_lines: true,
  });

  const result = [];

  for await (const row of table) {
    const installationKey = {
      key: row.key,
      gameId: { $oid: metalcoreGameId },
      active: false,
    };

    result.push(installationKey);
  }

  await fs.writeFile('parsed_keys.json', JSON.stringify(result, null, indentationSpace));

  console.log('Generating installation keys DONE');
};

main()
  .then(() => console.log('done'))
  .catch(console.log)
  .finally(() => process.exit(0));
