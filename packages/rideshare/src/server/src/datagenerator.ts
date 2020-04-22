import { stringify, parse } from 'querystring';
import { request } from 'https';

import { runCommand } from '@confluentinc/ksqldb-graphql';

import { ksqlDBOpts } from './index';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// taken from https://github.com/russau/kafka-websockets/blob/master/_experiments/python/velocity.py
// just less good because I think coordinates are the important part
type Payload = {
  centerX: string;
  centerY: string;
  zl: string;
  zv: string;
  fl: string;
  polyline: string;
  elev: string;
  rId: string;
  rdm: string;
  pta: string;
  distance: string;
  // eslint-disable-next-line
  show_name_description: string;
  name: string;
  description: string;
};
const createStatement = `create table cars (id VARCHAR, lat DOUBLE, long DOUBLE) with (KAFKA_TOPIC='cars', VALUE_FORMAT='JSON', key='id', partitions=1, replicas=1);`;
const uniqueCars = `create table unique_cars as select ID, count(*) from cars group by id emit changes;`;

const getRoute = (route: number): Promise<{ data: string }> => {
  const payload = stringify({ rId: route });
  return new Promise((resolve) => {
    let data = '';
    const req = request(
      'https://www.gmap-pedometer.com/gp/ajaxRoute/get',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.on('data', (d) => {
          data += Buffer.from(d).toString();
        });
      }
    );
    req.on('close', () => {
      resolve({ data });
    });
    req.end(payload, 'utf-8');
  });
};
async function generateData(id: string, route: number): Promise<void> {
  try {
    await runCommand(`${createStatement}${uniqueCars}`, ksqlDBOpts);
  } catch (e) {
    if (e.data?.message) {
      // eslint-disable-next-line
      console.error(e.data?.message);
    } else {
      // eslint-disable-next-line
      console.error(e.code);
    }
  }

  const response = await getRoute(route);
  const data: Payload = parse(response.data) as Payload;
  const lines = data.polyline.split('a');
  for (let i = 0; i < lines.length; i++) {
    const command = `insert into cars(id, lat, long) values('${id}', ${parseFloat(
      lines[i]
    )}, ${parseFloat(lines[i + 1])}); `;

    await runCommand(command, ksqlDBOpts);
    console.log(command);
    await sleep(3000);
    i++;
  }
}

export default async function generate(): Promise<void> {
  generateData('car1', 7428722);
  generateData('car2', 7429821);
  generateData('car3', 7429825);
  generateData('car4', 7430753);
}
