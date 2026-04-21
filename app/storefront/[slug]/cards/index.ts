import { CardPadrao } from './CardPadrao'
import { CardVTLX } from './CardVTLX'
import { CardVTClass } from './CardVTClass'
import { CardPremium } from './CardPremium'

export const cardMap = {
  padrao: CardPadrao,
  vtlx: CardVTLX,
  vtclass: CardVTClass,
  premium: CardPremium,
} as const

export { CardPadrao, CardVTLX, CardVTClass, CardPremium }
