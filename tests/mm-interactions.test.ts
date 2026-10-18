import { describe, test, expect } from "bun:test";
import { transferBalances, matchRoles, interactionInput, richestBonus } from "../src/lib/mm/interactions";
import { mmImportSchema } from "../src/lib/mm/import-schema";
import { DEMO_GAME } from "../src/lib/mm/demo-game";

describe("dinero y consentimiento", () => {
  test("el más rico recibe 20 puntos", () => { expect(richestBonus(100, [100,30],20)).toBe(20); expect(richestBonus(30,[100,30],20)).toBe(0); });
  test("empate de dinero premia a ambos y cero no premia", () => { expect(richestBonus(100,[100,100],20)).toBe(20); expect(richestBonus(0,[0,0],20)).toBe(0); });
  test("permite pago parcial: 30 de 100 sumados a 10", () => expect(transferBalances(100, 10, 30)).toEqual({ from: 70, to: 40 }));
  test("impide gastar más de lo disponible", () => expect(() => transferBalances(20, 10, 21)).toThrow());
  test("impide importes negativos, cero o fraccionarios", () => { for (const a of [-1, 0, 1.5]) expect(() => transferBalances(100, 10, a)).toThrow(); });
  test("no permite sustituir un personaje requerido", () => expect(() => matchRoles([{role:"a",character:"jekyll"}], [{id:"p",ref:"igor"}], [])).toThrow());
  test("exige un jugador diferente por papel", () => expect(() => matchRoles([{role:"a"},{role:"b"}], [{id:"p"},{id:"p"}], [])).toThrow());
  test("exige habilidad disponible", () => expect(() => matchRoles([{role:"a",ability:"Examinar"}], [{id:"p"}], [{player_id:"p",kind:"ability",name:"Examinar",uses_left:0}])).toThrow());
  test("asigna papeles sin depender del orden de selección", () => expect(matchRoles([{role:"a",character:"jekyll"},{role:"b",character:"igor"}], [{id:"i",ref:"igor"},{id:"j",ref:"jekyll"}], []).map(p=>p.id)).toEqual(["j","i"]));
  test("no admite cantidades fraccionarias en la petición", () => expect(interactionInput.safeParse({token:"1234567890",sessionId:crypto.randomUUID(),kind:"money",amount:1.5}).success).toBe(false));
  test("conserva dinero y uso al importar", () => {
    const fixture = structuredClone(DEMO_GAME) as any;
    fixture.characters[0].items.push({name:"Cartera",type:"money",amount:100,currency:"EUR",use:{mode:"give_money"}});
    const parsed = mmImportSchema.parse(fixture);
    expect(parsed.characters[0].items.find(i=>i.type==="money")?.amount).toBe(100);
    expect(parsed.characters[0].items.find(i=>i.type==="money")?.use?.mode).toBe("give_money");
  });
});