/**
 * Navigation — the approved §2.4 architecture, asserted as data.
 */
import { NAV2, nav2LeafRoutes, OPS2_BASE_PATH, ops2Path } from '../components/nav2/nav2.config';

describe('approved 2.0 navigation architecture (plan §2.4)', () => {
  it('has the exact top-level order: COMMAND · MARKETS · SELL · OPERATE · PEOPLE · INTELLIGENCE · ADMIN', () => {
    expect(NAV2.map((item) => item.label)).toEqual([
      'Command',
      'Markets',
      'Sell',
      'Operate',
      'People',
      'Intelligence',
      'Admin',
    ]);
  });

  it('SELL = Team Uniforms | LETTERED | ISSUE', () => {
    const sell = NAV2.find((item) => item.key === 'sell');
    expect(sell?.children?.map((c) => c.label)).toEqual(['Team Uniforms', 'LETTERED', 'ISSUE']);
  });

  it('OPERATE = Orders | Production | Creative', () => {
    const operate = NAV2.find((item) => item.key === 'operate');
    expect(operate?.children?.map((c) => c.label)).toEqual(['Orders', 'Production', 'Creative']);
  });

  it('PEOPLE = Team | Recruiting | Academy, with Academy deferred (R7)', () => {
    const people = NAV2.find((item) => item.key === 'people');
    expect(people?.children?.map((c) => c.label)).toEqual(['Team', 'Recruiting', 'Academy']);
    const academy = people?.children?.find((c) => c.label === 'Academy');
    expect(academy?.deferred).toBe(true);
  });

  it('INTELLIGENCE = Performance | Territory', () => {
    const intelligence = NAV2.find((item) => item.key === 'intelligence');
    expect(intelligence?.children?.map((c) => c.label)).toEqual(['Performance', 'Territory']);
  });

  it('COMMAND and MARKETS are mounted leaves under /ops', () => {
    expect(NAV2.find((item) => item.key === 'command')?.path).toBe(ops2Path('/command'));
    expect(NAV2.find((item) => item.key === 'markets')?.path).toBe(ops2Path('/markets'));
    expect(OPS2_BASE_PATH).toBe('/ops');
  });

  it('every leaf route is unique', () => {
    const routes = nav2LeafRoutes();
    expect(new Set(routes).size).toBe(routes.length);
  });
});
