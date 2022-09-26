import { DC } from "../../../core/constants";
import { GameDatabase } from "../game-database";
import { PlayerProgress } from "../../app/player-progress";

import { MultiplierTabHelper } from "./helper-functions";

/**
 * Scope structure for props is MAIN_RESOURCE.RESOURCE_COMPONENT and all fields must be functions which may or
 * may not accept an input argument.
 * {
 *  @property {function: @return String} name             Name to associate with this multiplier/effect
 *  @property {function: @return String} isBase           Suppresses the leading × in multipliers if true. Primarily
 *    exists in order to avoid copy-pasting extensive entries in multValue
 *  @property {function: @return Decimal} displayOverride If present, displays this string instead of multipliers. This
 *    has higher priority than isBase
 *  @property {function: @return Decimal|Number} multValue  Value for multipliers given by this effect. Note that some
 *    entries may have a pow10 applied to them in order to "undo" logarithmic scaling in the UI
 *  @property {function: @return Number} powValue         Numerical value for powers given by this effect
 *  @property {function: @return Boolean} isActive        Conditional determining if this component should be visible
 *  @property {function: @return String} color            CSS entry or string specifying this component's color
 *  @property {Array String} overlay                      String array to be used as HTML for an overlay on the tab; all
 *    entries in the array are rendered on top of each other
 *  @property {function: @return String} barOverlay       String to be used as HTML for an overlay on the percentage bar
 * }
 */
GameDatabase.multiplierTabValues = {
  AM: {
    total: {
      name: () => "Antimatter Production",
      multValue: () => {
        const totalMult = AntimatterDimensions.all
          .filter(ad => ad.isProducing)
          .map(ad => ad.multiplier)
          .reduce((x, y) => x.times(y), DC.D1);
        const totalTickspeed = Tickspeed.perSecond.pow(MultiplierTabHelper.activeDimCount("AD"));
        return totalMult.times(totalTickspeed);
      },
      isActive: () => AntimatterDimension(1).isProducing,
      overlay: ["<i class='fas fa-atom' />"],
    }
  },

  AD: {
    total: {
      name: dim => (dim ? `Total AD ${dim} Multiplier` : "All AD Multipliers"),
      multValue: dim => (dim
        ? AntimatterDimension(dim).multiplier
        : AntimatterDimensions.all
          .filter(ad => ad.isProducing)
          .map(ad => ad.multiplier)
          .reduce((x, y) => x.times(y), DC.D1)),
      isActive: dim => AntimatterDimension(dim ?? 1).isProducing,
      color: () => "var(--color-antimatter)",
      overlay: ["Ω", "<i class='fas fa-cube' />"],
      barOverlay: dim => `Ω${dim ?? ""}`,
    },
    purchase: {
      name: dim => (dim ? `AD ${dim} from Purchases` : "Total from Purchases"),
      multValue: dim => {
        const getPurchases = ad => (Laitela.continuumActive
          ? AntimatterDimension(ad).continuumValue
          : Math.floor(AntimatterDimension(ad).bought / 10)
        );
        if (dim) return Decimal.pow(AntimatterDimensions.buyTenMultiplier, getPurchases(dim));
        return AntimatterDimensions.all
          .filter(ad => ad.isProducing)
          .map(ad => Decimal.pow(AntimatterDimensions.buyTenMultiplier, getPurchases(ad.tier)))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: () => !EternityChallenge(11).isRunning,
      color: () => "var(--color-antimatter)",
      barOverlay: dim => `<i class="fas fa-arrow-up-right-dots" />${dim ?? ""}`,
    },
    dimboost: {
      name: dim => (dim ? `AD ${dim} from Dimboosts` : "Total from Dimboosts"),
      multValue: dim => (dim
        ? DimBoost.multiplierToNDTier(dim)
        : AntimatterDimensions.all
          .filter(ad => ad.isProducing)
          .map(ad => DimBoost.multiplierToNDTier(ad.tier))
          .reduce((x, y) => x.times(y), DC.D1)),
      isActive: () => true,
      color: () => GameDatabase.reality.glyphTypes.power.color,
      barOverlay: () => `<i class="fas fa-angles-up" />`,
    },
    sacrifice: {
      name: dim => (dim ? "AD 8 from Sacrifice" : "Sacrifice Multiplier"),
      multValue: dim => ((!dim || dim === 8) ? Sacrifice.totalBoost : DC.D1),
      isActive: dim => (!dim || dim === 8) && Sacrifice.totalBoost.gt(1),
      color: () => "var(--color-antimatter)",
      barOverlay: () => `Ω<i class="fas fa-turn-down" />`,
    },
    achievement: {
      name: dim => (dim ? `AD ${dim} from Achievements` : "Total from Achievements"),
      multValue: dim => {
        const allMult = new Decimal(Achievements.power).timesEffectsOf(
          Achievement(48),
          Achievement(56),
          Achievement(65),
          Achievement(72),
          Achievement(73),
          Achievement(74),
          Achievement(76),
          Achievement(84),
          Achievement(91),
          Achievement(92)
        );

        const dimMults = Array.repeat(DC.D1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          if (tier === 1) {
            dimMults[tier] = dimMults[tier].timesEffectsOf(
              Achievement(28),
              Achievement(31),
              Achievement(68),
              Achievement(71),
            );
          }
          dimMults[tier] = dimMults[tier].timesEffectsOf(
            tier === 8 ? Achievement(23) : null,
            tier < 8 ? Achievement(34) : null,
            tier <= 4 ? Achievement(64) : null,
          );
          if (Achievement(43).isUnlocked) {
            dimMults[tier] = dimMults[tier].times(1 + tier / 100);
          }
        }

        if (dim) return allMult.times(dimMults[dim]);
        let totalMult = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount("AD"); tier++) {
          totalMult = totalMult.times(dimMults[tier]).times(allMult);
        }
        return totalMult;
      },
      powValue: () => Achievement(183).effectOrDefault(1),
      isActive: () => true,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    infinityUpgrade: {
      name: dim => (dim ? `AD ${dim} from Infinity Upgrades` : "Total from Infinity Upgrades"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          InfinityUpgrade.totalTimeMult,
          InfinityUpgrade.thisInfinityTimeMult,
        );

        const dimMults = Array.repeat(DC.D1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          if (tier === 1) {
            dimMults[tier] = dimMults[tier].timesEffectsOf(
              InfinityUpgrade.unspentIPMult,
              InfinityUpgrade.unspentIPMult.chargedEffect,
            );
          }
          dimMults[tier] = dimMults[tier].timesEffectsOf(
            AntimatterDimension(tier).infinityUpgrade,
          );
        }

        if (dim) return allMult.times(dimMults[dim]);
        let totalMult = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount("AD"); tier++) {
          totalMult = totalMult.times(dimMults[tier]).times(allMult);
        }
        return totalMult;
      },
      powValue: dim => {
        const allPow = InfinityUpgrade.totalTimeMult.chargedEffect.effectOrDefault(1) *
          InfinityUpgrade.thisInfinityTimeMult.chargedEffect.effectOrDefault(1);

        const dimPow = Array.repeat(1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          dimPow[tier] = AntimatterDimension(tier).infinityUpgrade.chargedEffect.effectOrDefault(1);
        }

        if (dim) return allPow * dimPow[dim];
        // This isn't entirely accurate because you can't return a power for all ADs if only some of them actually have
        // it, so we cheat somewhat by returning the geometric mean of all actively producing dimensions (this should
        // be close to the same value if all the base multipliers are similar in magnitude)
        return allPow * Math.exp(dimPow.slice(1)
          .map(n => Math.log(n)).sum() / MultiplierTabHelper.activeDimCount("AD"));
      },
      isActive: () => PlayerProgress.infinityUnlocked(),
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-arrow-up" />`,
    },
    breakInfinityUpgrade: {
      name: dim => (dim ? `AD ${dim} from Break Infinity Upgrades` : "Total from Break Infinity Upgrades"),
      multValue: dim => {
        const mult = DC.D1.timesEffectsOf(
          BreakInfinityUpgrade.totalAMMult,
          BreakInfinityUpgrade.currentAMMult,
          BreakInfinityUpgrade.achievementMult,
          BreakInfinityUpgrade.slowestChallengeMult,
          BreakInfinityUpgrade.infinitiedMult
        );
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("AD"));
      },
      isActive: () => player.break,
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class="fab fa-skyatlas" />`,
    },
    infinityPower: {
      name: dim => (dim ? `AD ${dim} from Infinity Power` : "Total from Infinity Power"),
      multValue: dim => {
        const mult = Currency.infinityPower.value.pow(InfinityDimensions.powerConversionRate).max(1);
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("AD"));
      },
      isActive: () => Currency.infinityPower.value.gt(1) && !EternityChallenge(9).isRunning,
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-arrows-turn-right" />`,
    },
    infinityChallenge: {
      name: dim => (dim ? `AD ${dim} from Infinity Challenges` : "Total from Infinity Challenges"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          InfinityChallenge(3),
          InfinityChallenge(3).reward,
        );

        const dimMults = Array.repeat(DC.D1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          dimMults[tier] = dimMults[tier].timesEffectsOf(
            tier > 1 && tier < 8 ? InfinityChallenge(8).reward : null
          );
        }

        if (dim) return allMult.times(dimMults[dim]);
        let totalMult = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount("AD"); tier++) {
          totalMult = totalMult.times(dimMults[tier]).times(allMult);
        }
        return totalMult;
      },
      powValue: () => (InfinityChallenge(4).isCompleted ? InfinityChallenge(4).reward.effectValue : 1),
      isActive: () => player.break,
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-arrow-down-wide-short" />`,
    },
    timeStudy: {
      name: dim => (dim ? `AD ${dim} from Time Studies` : "Total from Time Studies"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          TimeStudy(91),
          TimeStudy(101),
          TimeStudy(161),
          TimeStudy(193),
        );

        const dimMults = Array.repeat(DC.D1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          if (tier === 1) {
            dimMults[tier] = dimMults[tier].timesEffectsOf(
              TimeStudy(234)
            );
          }

          // We don't want to double-count the base effect that TS31 boosts
          const infinitiedMult = DC.D1.timesEffectsOf(
            AntimatterDimension(tier).infinityUpgrade,
            BreakInfinityUpgrade.infinitiedMult
          );
          dimMults[tier] = dimMults[tier].times(infinitiedMult.pow(TimeStudy(31).effectOrDefault(1) - 1));

          dimMults[tier] = dimMults[tier].timesEffectsOf(
            tier < 8 ? TimeStudy(71) : null,
            tier === 8 ? TimeStudy(214) : null,
          );
        }

        if (dim) return allMult.times(dimMults[dim]);
        let totalMult = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount("AD"); tier++) {
          totalMult = totalMult.times(dimMults[tier]).times(allMult);
        }
        return totalMult;
      },
      isActive: () => PlayerProgress.eternityUnlocked(),
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-book" />`,
    },
    eternityChallenge: {
      name: dim => (dim ? `AD ${dim} from Eternity Challenges` : "Total from Eternity Challenges"),
      multValue: dim => Decimal.pow(EternityChallenge(10).effectValue,
        dim ? 1 : MultiplierTabHelper.activeDimCount("AD")),
      isActive: () => EternityChallenge(10).isRunning,
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ<i class="fas fa-arrow-down-wide-short" />`,
    },
    glyph: {
      name: dim => (dim ? `AD ${dim} from Glyph Effects` : "Total from Glyph Effects"),
      multValue: dim => {
        const mult = getAdjustedGlyphEffect("powermult");
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("AD"));
      },
      powValue: () => getAdjustedGlyphEffect("powerpow") * getAdjustedGlyphEffect("effarigdimensions"),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    alchemy: {
      name: dim => (dim ? `AD ${dim} from Glyph Alchemy` : "Total from Glyph Alchemy"),
      multValue: dim => {
        const mult = AlchemyResource.dimensionality.effectOrDefault(1)
          .times(Currency.realityMachines.value.powEffectOf(AlchemyResource.force));
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("AD"));
      },
      powValue: () => AlchemyResource.power.effectOrDefault(1) * Ra.momentumValue,
      isActive: () => Ra.unlocks.unlockGlyphAlchemy.canBeApplied,
      color: () => "var(--color-ra-pet--effarig)",
      barOverlay: () => `<i class="fas fa-vial" />`,
    },
    other: {
      name: dim => (dim ? `AD ${dim} from Other sources` : "Total from Other sources"),
      multValue: dim => {
        const mult = ShopPurchase.dimPurchases.currentMult * ShopPurchase.allDimPurchases.currentMult;
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("AD"));
      },
      powValue: () => VUnlocks.adPow.effectOrDefault(1) * PelleRifts.paradox.effectOrDefault(1),
      isActive: () => player.IAP.totalSTD > 0 || PlayerProgress.realityUnlocked(),
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
  },

  ID: {
    total: {
      name: dim => (dim ? `Total ID ${dim} Multiplier` : "All ID Multipliers"),
      multValue: dim => (dim
        ? InfinityDimension(dim).multiplier
        : InfinityDimensions.all
          .filter(id => id.isProducing)
          .map(id => id.multiplier)
          .reduce((x, y) => x.times(y), DC.D1)),
      isActive: dim => InfinityDimension(dim ?? 1).isProducing,
      color: () => "var(--color-infinity)",
      overlay: ["∞", "<i class='fa-solid fa-cube' />"],
      barOverlay: dim => `∞${dim ?? ""}`,
    },
    purchase: {
      name: dim => (dim ? `ID ${dim} from Purchases` : "Total from Purchases"),
      multValue: dim => {
        const getMult = id => Decimal.pow(InfinityDimension(id).powerMultiplier,
          Math.floor(InfinityDimension(id).baseAmount / 10));
        if (dim) return getMult(dim);
        return InfinityDimensions.all
          .filter(id => id.isProducing)
          .map(id => getMult(id.tier))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: () => !EternityChallenge(2).isRunning && !EternityChallenge(10).isRunning,
      color: () => "var(--color-infinity)",
      barOverlay: dim => `<i class="fas fa-arrow-up-right-dots" />${dim ?? ""}`,
    },

    basePurchase: {
      name: dim => (dim ? `Multiplier from base purchases` : "Total Multiplier from base purchases"),
      multValue: dim => {
        const getMult = id => {
          const purchases = id === 8
            ? Math.floor(InfinityDimension(id).baseAmount / 10)
            : Math.min(InfinityDimensions.HARDCAP_PURCHASES, Math.floor(InfinityDimension(id).baseAmount / 10));
          const baseMult = InfinityDimension(id)._powerMultiplier;
          return Decimal.pow(baseMult, purchases);
        };
        if (dim) return getMult(dim);
        return InfinityDimensions.all
          .filter(id => id.isProducing)
          .map(id => getMult(id.tier))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: dim => ImaginaryUpgrade(14).canBeApplied ||
        (dim === 8 ? GlyphSacrifice.infinity.effectValue > 1 : Tesseracts.bought > 0),
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class="fas fa-arrows-up-to-line" />`,
    },
    tesseractPurchase: {
      name: dim => (dim ? "Extra multiplier from Tesseracts" : "Total extra multiplier from Tesseracts"),
      multValue: dim => {
        const getMult = id => {
          if (id === 8) return DC.D1;
          const purchases = Math.floor(InfinityDimension(id).baseAmount / 10);
          return Decimal.pow(InfinityDimension(id).powerMultiplier,
            Math.clampMin(purchases - InfinityDimensions.HARDCAP_PURCHASES, 0));
        };
        if (dim) return getMult(dim);
        return InfinityDimensions.all
          .filter(id => id.isProducing)
          .map(id => getMult(id.tier))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: () => Tesseracts.bought > 0,
      color: () => "var(--color-enslaved--base)",
      barOverlay: () => `<i class="fas fa-up-right-and-down-left-from-center" />`,
    },
    infinityGlyphSacrifice: {
      name: () => "Extra multiplier from Infinity Glyph sacrifice",
      multValue: () => (InfinityDimension(8).isProducing
        ? Decimal.pow(GlyphSacrifice.infinity.effectValue, Math.floor(InfinityDimension(8).baseAmount / 10))
        : DC.D1),
      isActive: () => GlyphSacrifice.infinity.effectValue > 1,
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-turn-down" />`,
    },
    powPurchase: {
      name: () => "Power effect from Imaginary Upgrades",
      powValue: () => ImaginaryUpgrade(14).effectOrDefault(1),
      isActive: () => ImaginaryUpgrade(14).canBeApplied,
      color: () => "var(--color-ra--base)",
      barOverlay: () => `<i class="far fa-lightbulb" />`,
    },

    replicanti: {
      name: dim => (dim ? `ID ${dim} from Replicanti` : "Total from Replicanti"),
      multValue: dim => Decimal.pow(replicantiMult(), dim ? 1 : MultiplierTabHelper.activeDimCount("ID")),
      isActive: () => Replicanti.areUnlocked,
      color: () => GameDatabase.reality.glyphTypes.replication.color,
      barOverlay: () => `Ξ`,
    },
    achievement: {
      name: dim => (dim ? `ID ${dim} from Achievements` : "Total from Achievements"),
      multValue: dim => {
        const baseMult = new Decimal(Achievement(75).effectOrDefault(1));
        if (dim) return dim === 1 ? baseMult.times(Achievement(94).effectOrDefault(1)) : baseMult;
        const maxActiveDim = MultiplierTabHelper.activeDimCount("ID");
        return Decimal.pow(baseMult, maxActiveDim).times(maxActiveDim > 0 ? Achievement(94).effectOrDefault(1) : DC.D1);
      },
      isActive: () => Achievement(75).canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    timeStudy: {
      name: dim => (dim
        ? `ID ${dim} from Time Studies and Eternity Upgrades`
        : "Total from Time Studies and Eternity Upgrades"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          TimeStudy(82),
          TimeStudy(92),
          TimeStudy(162),
          EternityUpgrade.idMultEP,
          EternityUpgrade.idMultEternities,
          EternityUpgrade.idMultICRecords,
        );
        if (dim) return dim === 4 ? allMult.times(TimeStudy(72).effectOrDefault(1)) : allMult;
        const maxActiveDim = MultiplierTabHelper.activeDimCount("ID");
        return Decimal.pow(allMult, maxActiveDim).times(maxActiveDim >= 4 ? TimeStudy(72).effectOrDefault(1) : DC.D1);
      },
      isActive: () => Achievement(75).canBeApplied,
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-book" />`,
    },
    infinityChallenge: {
      name: dim => (dim ? `ID ${dim} from Infinity Challenges` : "Total from Infinity Challenges"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          InfinityChallenge(1).reward,
          InfinityChallenge(6).reward,
        );
        return Decimal.pow(allMult, dim ? 1 : MultiplierTabHelper.activeDimCount("ID"));
      },
      isActive: () => InfinityChallenge(1).isCompleted,
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-arrow-down-wide-short" />`,
    },
    eternityChallenge: {
      name: dim => (dim ? `ID ${dim} from Eternity Challenges` : "Total from Eternity Challenges"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          EternityChallenge(4).reward,
          EternityChallenge(9).reward,
        );
        if (dim) return dim === 1 ? allMult.times(EternityChallenge(2).reward.effectOrDefault(1)) : allMult;
        const maxActiveDim = MultiplierTabHelper.activeDimCount("ID");
        return Decimal.pow(allMult, maxActiveDim)
          .times(maxActiveDim >= 1 ? EternityChallenge(2).reward.effectOrDefault(1) : DC.D1);
      },
      isActive: () => EternityChallenge(2).completions > 0,
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ<i class="fas fa-arrow-down-wide-short" />`,
    },
    glyph: {
      name: dim => (dim ? `ID ${dim} from Glyph Effects` : "Total from Glyph Effects"),
      multValue: () => 1,
      powValue: () => getAdjustedGlyphEffect("infinitypow") * getAdjustedGlyphEffect("effarigdimensions"),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    alchemy: {
      name: dim => {
        const imStr = MachineHandler.isIMUnlocked ? " and Imaginary Upgrades" : "";
        return dim ? `ID ${dim} from Glyph Alchemy${imStr}` : `Total from Glyph Alchemy${imStr}`;
      },
      multValue: dim => {
        const mult = DC.D1.timesEffectsOf(
          AlchemyResource.dimensionality,
          ImaginaryUpgrade(8),
        );
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("ID"));
      },
      powValue: () => AlchemyResource.infinity.effectOrDefault(1) * Ra.momentumValue,
      isActive: () => Ra.unlocks.unlockGlyphAlchemy.canBeApplied,
      color: () => "var(--color-ra-pet--effarig)",
      barOverlay: () => `<i class="fas fa-vial" />`,
    },
    other: {
      name: dim => (dim ? `ID ${dim} from Other sources` : "Total from Other sources"),
      multValue: dim => {
        const mult = new Decimal(ShopPurchase.allDimPurchases.currentMult).timesEffectsOf(
          PelleRifts.recursion.milestones[1]
        );
        const maxActiveDim = MultiplierTabHelper.activeDimCount("ID");
        return Decimal.pow(mult, dim ? 1 : maxActiveDim)
          .times(maxActiveDim >= 1 ? PelleRifts.decay.milestones[0].effectOrDefault(1) : DC.D1);
      },
      powValue: () => PelleRifts.paradox.effectOrDefault(1),
      isActive: () => player.IAP.totalSTD > 0 || Pelle.isDoomed,
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
    powerConversion: {
      name: () => "Infinity Power Conversion",
      powValue: () => InfinityDimensions.powerConversionRate,
      isActive: () => Currency.infinityPower.value.gt(1) && !EternityChallenge(9).isRunning,
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class="fas fa-arrow-down-up-across-line" />`,
    }
  },

  TD: {
    total: {
      name: dim => (dim ? `Total TD ${dim} Multiplier` : "All TD Multipliers"),
      multValue: dim => (dim
        ? TimeDimension(dim).multiplier
        : TimeDimensions.all
          .filter(td => td.isProducing)
          .map(td => td.multiplier)
          .reduce((x, y) => x.times(y), DC.D1)),
      isActive: dim => TimeDimension(dim ?? 1).isProducing,
      color: () => "var(--color-eternity)",
      overlay: ["Δ", "<i class='fa-solid fa-cube' />"],
      barOverlay: dim => `Δ${dim ?? ""}`,
    },
    purchase: {
      name: dim => (dim ? `TD ${dim} from Purchases` : "Total from Purchases"),
      multValue: dim => {
        const getMult = td => {
          const d = TimeDimension(td);
          const bought = td === 8 ? Math.clampMax(d.bought, 1e8) : d.bought;
          return Decimal.pow(d.powerMultiplier, bought);
        };
        if (dim) return getMult(dim);
        return TimeDimensions.all
          .filter(td => td.isProducing)
          .map(td => getMult(td.tier))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: () => !EternityChallenge(2).isRunning && !EternityChallenge(10).isRunning,
      color: () => "var(--color-eternity)",
      barOverlay: dim => `<i class="fas fa-arrow-up-right-dots" />${dim ?? ""}`,
    },

    basePurchase: {
      name: () => "Base Multiplier from purchases",
      multValue: dim => {
        const getMult = td => Decimal.pow(4,
          td === 8 ? Math.clampMax(TimeDimension(td).bought, 1e8) : TimeDimension(td).bought);
        if (dim) return getMult(dim);
        return TimeDimensions.all
          .filter(td => td.isProducing)
          .map(td => getMult(td.tier))
          .reduce((x, y) => x.times(y), DC.D1);
      },
      isActive: dim => (dim
        ? ImaginaryUpgrade(14).canBeApplied || (dim === 8 && GlyphSacrifice.time.effectValue > 1)
        : TimeDimension(1).isProducing),
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-arrow-up-right-dots" />`,
    },
    timeGlyphSacrifice: {
      name: () => "Extra multiplier from Time Glyph sacrifice",
      multValue: () => (TimeDimension(8).isProducing
        ? Decimal.pow(GlyphSacrifice.time.effectValue, Math.clampMax(TimeDimension(8).bought, 1e8))
        : DC.D1),
      isActive: () => GlyphSacrifice.time.effectValue > 1,
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ<i class="fas fa-turn-down" />`,
    },
    powPurchase: {
      name: () => "Power effect from Imaginary Upgrades",
      powValue: () => ImaginaryUpgrade(14).effectOrDefault(1),
      isActive: () => ImaginaryUpgrade(14).canBeApplied,
      color: () => "var(--color-ra--base)",
      barOverlay: () => `<i class="far fa-lightbulb" />`,
    },

    achievement: {
      name: dim => (dim ? `TD ${dim} from Achievements` : "Total from Achievements"),
      multValue: dim => {
        const baseMult = DC.D1.timesEffectsOf(
          Achievement(105),
          Achievement(128),
          EternityUpgrade.tdMultAchs,
        );
        return Decimal.pow(baseMult, dim ? 1 : MultiplierTabHelper.activeDimCount("TD"));
      },
      isActive: () => Achievement(75).canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    timeStudy: {
      name: dim => (dim
        ? `TD ${dim} from Time Studies and Eternity Upgrades`
        : "Total from Time Studies and Eternity Upgrades"),
      multValue: dim => {
        const allMult = DC.D1.timesEffectsOf(
          TimeStudy(93),
          TimeStudy(103),
          TimeStudy(151),
          TimeStudy(221),
          TimeStudy(301),
          EternityUpgrade.tdMultTheorems,
          EternityUpgrade.tdMultRealTime,
        );

        const dimMults = Array.repeat(DC.D1, 9);
        for (let tier = 1; tier <= 8; tier++) {
          dimMults[tier] = dimMults[tier].timesEffectsOf(
            tier === 1 ? TimeStudy(11) : null,
            tier === 3 ? TimeStudy(73) : null,
            tier === 4 ? TimeStudy(227) : null
          );
        }

        if (dim) return allMult.times(dimMults[dim]);
        let totalMult = DC.D1;
        for (let tier = 1; tier <= MultiplierTabHelper.activeDimCount("TD"); tier++) {
          totalMult = totalMult.times(dimMults[tier]).times(allMult);
        }
        return totalMult;
      },
      isActive: () => Achievement(75).canBeApplied,
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-book" />`,
    },
    eternityChallenge: {
      name: dim => (dim ? `TD ${dim} from Eternity Challenges` : "Total from Eternity Challenges"),
      multValue: dim => {
        let allMult = DC.D1.timesEffectsOf(
          EternityChallenge(1).reward,
          EternityChallenge(10).reward,
        );
        if (EternityChallenge(9).isRunning) {
          allMult = allMult.times(
            Decimal.pow(Math.clampMin(Currency.infinityPower.value.pow(InfinityDimensions.powerConversionRate / 7)
              .log2(), 1), 4).clampMin(1));
        }
        return Decimal.pow(allMult, dim ? 1 : MultiplierTabHelper.activeDimCount("TD"));
      },
      isActive: () => EternityChallenge(1).completions > 0,
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ<i class="fas fa-arrow-down-wide-short" />`,
    },
    glyph: {
      name: dim => (dim ? `TD ${dim} from Glyph Effects` : "Total from Glyph Effects"),
      multValue: () => 1,
      powValue: () => getAdjustedGlyphEffect("timepow") * getAdjustedGlyphEffect("effarigdimensions"),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    alchemy: {
      name: dim => {
        const imStr = MachineHandler.isIMUnlocked ? " and Imaginary Upgrades" : "";
        return dim ? `TD ${dim} from Glyph Alchemy${imStr}` : `Total from Glyph Alchemy${imStr}`;
      },
      multValue: dim => {
        const mult = DC.D1.timesEffectsOf(
          AlchemyResource.dimensionality,
          ImaginaryUpgrade(11),
        );
        return Decimal.pow(mult, dim ? 1 : MultiplierTabHelper.activeDimCount("TD"));
      },
      powValue: () => AlchemyResource.time.effectOrDefault(1) * Ra.momentumValue,
      isActive: () => Ra.unlocks.unlockGlyphAlchemy.canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-vial" />`,
    },
    other: {
      name: dim => (dim ? `TD ${dim} from Other sources` : "Total from Other sources"),
      multValue: dim => {
        const mult = new Decimal(ShopPurchase.allDimPurchases.currentMult).timesEffectsOf(
          Replicanti.areUnlocked && Replicanti.amount.gt(1) ? DilationUpgrade.tdMultReplicanti : null,
          Pelle.isDoomed ? null : RealityUpgrade(22),
          PelleRifts.chaos
        );
        const maxActiveDim = MultiplierTabHelper.activeDimCount("TD");
        return Decimal.pow(mult, dim ? 1 : maxActiveDim);
      },
      powValue: () => PelleRifts.paradox.effectOrDefault(1),
      isActive: () => player.IAP.totalSTD > 0 || Pelle.isDoomed,
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
  },

  IP: {
    total: {
      name: () => "Total IP Gained",
      isBase: () => true,
      multValue: () => gainedInfinityPoints(),
      isActive: () => player.break,
      overlay: ["∞", "<i class='fa-solid fa-layer-group' />"],
    },
    base: {
      name: () => "Base Infinity Points",
      isBase: () => true,
      multValue: () => {
        const div = Effects.min(
          308,
          Achievement(103),
          TimeStudy(111)
        );
        return Decimal.pow10(player.records.thisInfinity.maxAM.log10() / div - 0.75);
      },
      isActive: () => player.break,
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class='fas fa-atom' /><i class='fa-solid fa-arrow-right-arrow-left' />`,
    },
    antimatter: {
      name: () => "Infinity Points from Antimatter",
      displayOverride: () => `${format(player.records.thisInfinity.maxAM, 2, 2)} AM`,
      // This just needs to be larger than 1 to make sure it's visible, the math is handled in powValue for divisor
      multValue: () => 10,
      isActive: () => player.break,
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class='fas fa-atom' />`,
    },
    divisor: {
      name: () => "Formula Improvement",
      displayOverride: () => {
        const div = Effects.min(308, Achievement(103), TimeStudy(111));
        return `log(AM)/${formatInt(308)} ➜ log(AM)/${format(div, 2, 1)}`;
      },
      powValue: () => 308 / Effects.min(308, Achievement(103), TimeStudy(111)),
      isActive: () => player.break,
      color: () => "var(--color-infinity)",
      barOverlay: () => `<i class='fas fa-calculator' />`,
    },
    infinityUpgrade: {
      name: () => "Repeatable Infinity Upgrade",
      multValue: () => InfinityUpgrade.ipMult.effectOrDefault(1),
      isActive: () => player.break && !Pelle.isDoomed,
      color: () => "var(--color-infinity)",
      barOverlay: () => `∞<i class="fas fa-arrow-up" />`,
    },
    achievement: {
      name: () => "Achievements",
      multValue: () => DC.D1.timesEffectsOf(
        Achievement(85),
        Achievement(93),
        Achievement(116),
        Achievement(125),
        Achievement(141).effects.ipGain,
      ),
      isActive: () => player.break && !Pelle.isDoomed,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    timeStudy: {
      name: () => "Time Studies",
      multValue: () => DC.D1.timesEffectsOf(
        TimeStudy(41),
        TimeStudy(51),
        TimeStudy(141),
        TimeStudy(142),
        TimeStudy(143),
      ),
      isActive: () => player.break && !Pelle.isDoomed,
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-book" />`,
    },
    dilationUpgrade: {
      name: () => "Dilation Upgrades",
      multValue: () => DilationUpgrade.ipMultDT.effectOrDefault(1),
      isActive: () => player.break && !Pelle.isDoomed && DilationUpgrade.ipMultDT.canBeApplied,
      color: () => "var(--color-dilation)",
      barOverlay: () => `Ψ<i class="fas fa-arrow-up" />`,
    },
    glyph: {
      name: () => (Ra.unlocks.unlockGlyphAlchemy.canBeApplied
        ? "Equipped Glyphs and Glyph Alchemy"
        : "Equipped Glyphs"),
      multValue: () => Replicanti.amount.powEffectOf(AlchemyResource.exponential)
        .times(getAdjustedGlyphEffect("infinityIP")),
      powValue: () => (GlyphAlteration.isAdded("infinity") ? getSecondaryGlyphEffect("infinityIP") : 1),
      isActive: () => PlayerProgress.realityUnlocked() && !Pelle.isDoomed,
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    other: {
      name: () => "IP Multipliers from Other sources",
      multValue: () => DC.D1.times(ShopPurchase.IPPurchases.currentMult)
        .timesEffectsOf(PelleRifts.vacuum)
        .times(Pelle.specialGlyphEffect.infinity),
      isActive: () => player.IAP.totalSTD > 0 || Pelle.isDoomed,
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
  },

  EP: {
    total: {
      name: () => "Total EP Gained",
      isBase: () => true,
      multValue: () => gainedEternityPoints(),
      isActive: () => PlayerProgress.eternityUnlocked(),
      overlay: ["Δ", "<i class='fa-solid fa-layer-group' />"],
    },
    base: {
      name: () => "Base Eternity Points",
      isBase: () => true,
      multValue: () => DC.D5.pow(player.records.thisEternity.maxIP.plus(
        gainedInfinityPoints()).log10() / (308 - PelleRifts.recursion.effectValue.toNumber()) - 0.7),
      isActive: () => PlayerProgress.eternityUnlocked(),
      color: () => "var(--color-eternity)",
      barOverlay: () => `∞<i class='fa-solid fa-arrow-right-arrow-left' />`,
    },
    IP: {
      name: () => "Eternity Points from Infinity Points",
      displayOverride: () => `${format(player.records.thisEternity.maxIP.plus(gainedInfinityPoints()), 2, 2)} IP`,
      // This just needs to be larger than 1 to make sure it's visible, the math is handled in powValue for divisor
      multValue: () => 10,
      isActive: () => PlayerProgress.eternityUnlocked(),
      color: () => "var(--color-eternity)",
      barOverlay: () => `∞`,
    },
    divisor: {
      name: () => "Formula Improvement",
      displayOverride: () => {
        const div = 308 - PelleRifts.recursion.effectValue.toNumber();
        return `log(IP)/${formatInt(308)} ➜ log(IP)/${format(div, 2, 2)}`;
      },
      powValue: () => 308 / (308 - PelleRifts.recursion.effectValue.toNumber()),
      isActive: () => PelleRifts.recursion.isActive,
      color: () => "var(--color-pelle--base)",
      barOverlay: () => `<i class='fas fa-calculator' />`,
    },
    eternityUpgrade: {
      name: () => "Repeatable Eternity Upgrade",
      multValue: () => EternityUpgrade.epMult.effectOrDefault(1),
      isActive: () => PlayerProgress.eternityUnlocked() && !Pelle.isDoomed,
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ<i class="fas fa-arrow-up" />`,
    },
    timeStudy: {
      name: () => "Time Studies",
      multValue: () => DC.D1.timesEffectsOf(
        TimeStudy(61),
        TimeStudy(122),
        TimeStudy(121),
        TimeStudy(123),
      ),
      isActive: () => PlayerProgress.eternityUnlocked() && !Pelle.isDoomed,
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-book" />`,
    },
    glyph: {
      name: () => "Equipped Glyphs and Reality Upgrades",
      multValue: () => DC.D1.timesEffectsOf(
        RealityUpgrade(12),
        GlyphEffect.epMult
      ),
      powValue: () => (GlyphAlteration.isAdded("time") ? getSecondaryGlyphEffect("timeEP") : 1),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    other: {
      name: () => "IP Multipliers from Other sources",
      multValue: () => DC.D1.times(ShopPurchase.EPPurchases.currentMult)
        .timesEffectsOf(PelleRifts.vacuum.milestones[2])
        .times(Pelle.specialGlyphEffect.time),
      isActive: () => player.IAP.totalSTD > 0 || Pelle.isDoomed,
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
  },

  TP: {
    total: {
      name: () => "Total Tachyon Particles",
      multValue: () => getDilationGainPerSecond(),
      isActive: () => getDilationGainPerSecond().gt(0),
      color: () => "var(--color-dilation)",
      barOverlay: () => `<i class="fas fa-meteor" />`,
    },
    base: {
      name: () => "Tachyon Particles",
      isBase: () => true,
      multValue: () => Currency.tachyonParticles.value.div(tachyonGainMultiplier()),
      isActive: () => Currency.tachyonParticles.value.gt(0),
      color: () => "var(--color-dilation)",
      barOverlay: () => `<i class="fas fa-atom" />`,
    },
    achievement: {
      name: () => "Achievement 132",
      multValue: () => Achievement(132).effectOrDefault(1),
      isActive: () => Achievement(132).canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    dilation: {
      name: () => "Repeatable Dilation Upgrade",
      multValue: () => DilationUpgrade.tachyonGain.effectOrDefault(1),
      isActive: () => DilationUpgrade.tachyonGain.canBeApplied,
      color: () => "var(--color-dilation)",
      barOverlay: () => `Ψ<i class="fas fa-repeat" />`,
    },
    realityUpgrade: {
      name: () => "Reality Upgrades",
      multValue: () => DC.D1.timesEffectsOf(RealityUpgrade(4), RealityUpgrade(8), RealityUpgrade(15)),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `Ϟ`,
    },
    dilationGlyphSacrifice: {
      name: () => "Dilation Glyph Sacrifice",
      multValue: () => GlyphSacrifice.dilation.effectValue,
      isActive: () => GlyphSacrifice.dilation.effectValue > 1,
      color: () => "var(--color-dilation)",
      barOverlay: () => `Ψ<i class="fas fa-turn-down" />`,
    },
  },

  DT: {
    total: {
      name: () => "Dilated Time gain",
      multValue: () => getDilationGainPerSecond(),
      isActive: () => getDilationGainPerSecond().gt(0),
      color: () => "var(--color-dilation)",
      overlay: ["Ψ"],
      barOverlay: () => `Ψ`,
    },
    tachyon: {
      name: () => "Tachyon Particles",
      displayOverride: () => {
        const baseTPStr = format(Currency.tachyonParticles.value, 2, 2);
        return PelleRifts.paradox.milestones[1].canBeApplied
          ? `${baseTPStr}${formatPow(PelleRifts.paradox.milestones[1].effectValue, 1)}`
          : baseTPStr;
      },
      multValue: () => Currency.tachyonParticles.value.pow(PelleRifts.paradox.milestones[1].effectOrDefault(1)),
      isActive: () => getDilationGainPerSecond().gt(0),
      color: () => "var(--color-dilation)",
      barOverlay: () => `<i class="fas fa-meteor" />`,
    },
    achievement: {
      name: () => "Achievements",
      multValue: () => Achievement(132).effectOrDefault(1) * Achievement(137).effectOrDefault(1),
      isActive: () => Achievement(132).canBeApplied || Achievement(137).canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: () => `<i class="fas fa-trophy" />`,
    },
    dilation: {
      name: () => "Repeatable Dilation Upgrades",
      multValue: () => DC.D1.timesEffectsOf(
        DilationUpgrade.dtGain,
        DilationUpgrade.dtGainPelle,
        DilationUpgrade.flatDilationMult
      ),
      isActive: () => DC.D1.timesEffectsOf(
        DilationUpgrade.dtGain,
        DilationUpgrade.dtGainPelle,
        DilationUpgrade.flatDilationMult
      ).gt(1),
      color: () => "var(--color-dilation)",
      barOverlay: () => `Ψ<i class="fas fa-repeat" />`,
    },
    realityUpgrade: {
      name: () => "Repeatable Reality Upgrade",
      multValue: () => RealityUpgrade(1).effectOrDefault(1),
      isActive: () => RealityUpgrade(1).canBeApplied,
      color: () => "var(--color-reality)",
      barOverlay: () => `Ϟ`,
    },
    glyph: {
      name: () => "Glyph Effects",
      multValue: () => Decimal.times(getAdjustedGlyphEffect("dilationDT"),
        Math.clampMin(Decimal.log10(Replicanti.amount) * getAdjustedGlyphEffect("replicationdtgain"), 1)),
      isActive: () => PlayerProgress.realityUnlocked(),
      color: () => "var(--color-reality)",
      barOverlay: () => `<i class="fas fa-clone" />`,
    },
    ra: {
      name: () => "Ra Upgrades",
      multValue: () => DC.D1.timesEffectsOf(
        AlchemyResource.dilation,
        Ra.unlocks.continuousTTBoost.effects.dilatedTime,
        Ra.unlocks.peakGamespeedDT
      ),
      isActive: () => Ra.unlocks.autoTP.canBeApplied,
      color: () => "var(--color-ra--base)",
      barOverlay: () => `<i class="fas fa-sun" />`,
    },
    other: {
      name: () => "Other sources",
      multValue: () => new Decimal(ShopPurchase.dilatedTimePurchases.currentMult ** (Pelle.isDoomed ? 0.5 : 1))
        .times(Pelle.specialGlyphEffect.dilation),
      isActive: () => player.IAP.totalSTD > 0 || Pelle.isDoomed,
      barOverlay: () => `<i class="fas fa-ellipsis" />`,
    },
  },

  // Both multValue entries are multiplied by 1e10 as a bit of a cheat; decomposeTickspeed returns a fraction, but the
  // Vue component suppresses numbers less than one. Multiplying by 1e10 is a workaround because in practice the split
  // between the components should never be that skewed
  tickspeed: {
    total: {
      name: () => "Total Tickspeed",
      displayOverride: () => {
        const tickRate = Tickspeed.perSecond;
        const activeDims = MultiplierTabHelper.activeDimCount("AD");
        return `${format(tickRate, 2, 2)}/sec on ${formatInt(activeDims)} ${pluralize("Dimension", activeDims)}
          ➜ ${formatX(tickRate.pow(activeDims), 2, 2)}`;
      },
      multValue: () => Tickspeed.perSecond.pow(MultiplierTabHelper.activeDimCount("AD")),
      isActive: () => true,
      color: () => "var(--color-eternity)",
      overlay: ["<i class='fa-solid fa-clock' />"],
      barOverlay: () => `<i class="fas fa-clock" />`,
    },
    upgrades: {
      name: () => "Tickspeed Upgrades",
      displayOverride: () => `${formatInt(Tickspeed.totalUpgrades)} Total`,
      multValue: () => new Decimal.pow10(1e10 * MultiplierTabHelper.decomposeTickspeed().tickspeed),
      isActive: () => true,
      color: () => GameDatabase.reality.glyphTypes.power.color,
      barOverlay: () => `<i class="fas fa-arrow-up" />`,
    },
    galaxies: {
      name: () => "Galaxies",
      displayOverride: () => {
        const ag = player.galaxies + GalaxyGenerator.galaxies;
        const rg = Replicanti.galaxies.total;
        const tg = player.dilation.totalTachyonGalaxies;
        return `${formatInt(ag + rg + tg)} Total`;
      },
      multValue: () => new Decimal.pow10(1e10 * MultiplierTabHelper.decomposeTickspeed().galaxies),
      isActive: () => true,
      color: () => "var(--color-eternity)",
      barOverlay: () => `<i class="fas fa-bahai" />`,
    },
  },

  tickspeedUpgrades: {
    purchased: {
      name: () => "Purchased Tickspeed Upgrades",
      displayOverride: () => (Laitela.continuumActive
        ? format(Tickspeed.continuumValue, 2, 2)
        : formatInt(player.totalTickBought)),
      multValue: () => Decimal.pow10(Laitela.continuumActive ? Tickspeed.continuumValue : player.totalTickBought),
      isActive: () => true,
      color: () => GameDatabase.reality.glyphTypes.power.color,
      barOverlay: () => `<i class="fas fa-arrow-up-right-dots" />`,
    },
    free: {
      name: () => "Tickspeed Upgrades from TD",
      displayOverride: () => formatInt(player.totalTickGained),
      multValue: () => Decimal.pow10(player.totalTickGained),
      isActive: () => Currency.timeShards.gt(0),
      color: () => "var(--color-eternity)",
      barOverlay: () => `Δ`,
    }
  },

  // Note: none of the galaxy types use the global multiplier that applies to all of them within multValue, which
  // very slightly reduces performance impact and is okay because it's applied consistently
  galaxies: {
    antimatter: {
      name: () => "Antimatter Galaxies",
      displayOverride: () => {
        const num = player.galaxies + GalaxyGenerator.galaxies;
        const mult = MultiplierTabHelper.globalGalaxyMult();
        return `${formatInt(num)}, ${formatX(mult, 2, 2)} strength`;
      },
      multValue: () => Decimal.pow10(player.galaxies + GalaxyGenerator.galaxies),
      isActive: () => true,
      color: () => GameDatabase.reality.glyphTypes.power.color,
      barOverlay: () => `<i class='fas fa-atom' />`,
    },
    replicanti: {
      name: () => "Replicanti Galaxies",
      displayOverride: () => {
        const num = Replicanti.galaxies.total;
        let rg = Replicanti.galaxies.bought;
        rg *= (1 + Effects.sum(TimeStudy(132), TimeStudy(133)));
        rg += Replicanti.galaxies.extra;
        rg += Math.min(Replicanti.galaxies.bought, ReplicantiUpgrade.galaxies.value) *
          Effects.sum(EternityChallenge(8).reward);
        const mult = rg / Math.clampMin(num, 1) * MultiplierTabHelper.globalGalaxyMult();
        return `${formatInt(num)}, ${formatX(mult, 2, 2)} strength`;
      },
      multValue: () => {
        let rg = Replicanti.galaxies.bought;
        rg *= (1 + Effects.sum(TimeStudy(132), TimeStudy(133)));
        rg += Replicanti.galaxies.extra;
        rg += Math.min(Replicanti.galaxies.bought, ReplicantiUpgrade.galaxies.value) *
          Effects.sum(EternityChallenge(8).reward);
        return Decimal.pow10(rg);
      },
      isActive: () => Replicanti.areUnlocked,
      color: () => GameDatabase.reality.glyphTypes.replication.color,
      barOverlay: () => `Ξ`,
    },
    tachyon: {
      name: () => "Tachyon Galaxies",
      displayOverride: () => {
        const num = player.dilation.totalTachyonGalaxies;
        const mult = MultiplierTabHelper.globalGalaxyMult() *
          (1 + Math.max(0, Replicanti.amount.log10() / 1e6) * AlchemyResource.alternation.effectValue);
        return `${formatInt(num)}, ${formatX(mult, 2, 2)} strength`;
      },
      multValue: () => {
        const num = player.dilation.totalTachyonGalaxies;
        const mult = 1 + Math.max(0, Replicanti.amount.log10() / 1e6) * AlchemyResource.alternation.effectValue;
        return Decimal.pow10(num * mult);
      },
      isActive: () => player.dilation.totalTachyonGalaxies > 0,
      color: () => "var(--color-dilation)",
      barOverlay: () => `Ψ`,
    },
  },

  general: {
    achievement: {
      name: (ach, dim) => (dim?.length === 2
        ? `Achievement ${ach} on all ${dim}`
        : `Achievement ${ach}`),
      multValue: (ach, dim) => {
        // There is also a buy10 effect, but we don't track that in the multiplier tab
        if (ach === 141) return Achievement(141).canBeApplied ? Achievement(141).effects.ipGain.effectOrDefault(1) : 1;
        if (!dim) return Achievement(ach).canBeApplied ? Achievement(ach).effectOrDefault(1) : 1;

        if (dim?.length === 2) {
          let totalEffect = DC.D1;
          for (let tier = 1; tier < MultiplierTabHelper.activeDimCount(dim); tier++) {
            let singleEffect;
            if (ach === 43) singleEffect = Achievement(43).canBeApplied ? (1 + tier / 100) : 1;
            else singleEffect = (MultiplierTabHelper.achievementDimCheck(ach, `${dim}${tier}`) &&
              Achievement(ach).canBeApplied) ? Achievement(ach).effectOrDefault(1) : 1;
            totalEffect = totalEffect.times(singleEffect);
          }
          return totalEffect;
        }

        if (ach === 43) return Achievement(43).canBeApplied ? (1 + Number(dim.charAt(2)) / 100) : 1;
        return (MultiplierTabHelper.achievementDimCheck(ach, dim) && Achievement(ach).canBeApplied)
          ? Achievement(ach).effectOrDefault(1) : 1;
      },
      isActive: ach => Achievement(ach).canBeApplied,
      color: () => "var(--color-v--base)",
      barOverlay: ach => `<i class="fas fa-trophy" />${ach}`,
    },
    timeStudy: {
      name: (ts, dim) => (dim?.length === 2
        ? `Time Study ${ts} on all ${dim}`
        : `Time Study ${ts}`),
      multValue: (ts, dim) => {
        if (!dim) return TimeStudy(ts).canBeApplied ? TimeStudy(ts).effectOrDefault(1) : 1;
        if (dim?.length === 2) {
          let totalEffect = DC.D1;
          for (let tier = 1; tier < MultiplierTabHelper.activeDimCount(dim); tier++) {
            totalEffect = totalEffect.times((MultiplierTabHelper.timeStudyDimCheck(ts, `${dim}${tier}`) &&
              TimeStudy(ts).isBought) ? TimeStudy(ts).effectOrDefault(1) : 1);
          }
          return totalEffect;
        }
        // The new Decimal() wrapper is necessary because, for some inexplicable reason, replicanti becomes
        // reactive through TS101 if that isn't there
        return (MultiplierTabHelper.timeStudyDimCheck(ts, dim) && TimeStudy(ts).isBought)
          ? new Decimal(TimeStudy(ts).effectOrDefault(1)) : 1;
      },
      isActive: ts => TimeStudy(ts).isBought,
      color: () => "var(--color-eternity)",
      barOverlay: ts => `<i class="fas fa-book" />${ts}`,
    },
    infinityChallenge: {
      name: ic => `Effect from Infinity Challenge ${ic}`,
      multValue: (ic, dim) => {
        if (ic === 4) return 1;
        if (dim?.length === 2) {
          let totalEffect = DC.D1;
          for (let tier = 1; tier < MultiplierTabHelper.activeDimCount(dim); tier++) {
            totalEffect = totalEffect.times((MultiplierTabHelper.ICDimCheck(ic, `${dim}${tier}`) &&
              InfinityChallenge(ic).isCompleted) ? InfinityChallenge(ic).reward.effectOrDefault(1) : 1);
          }
          return totalEffect;
        }
        if (ic === 8) return (dim > 1 && dim < 8) ? InfinityChallenge(ic).reward.effectValue : DC.D1;
        return InfinityChallenge(ic).reward.effectValue;
      },
      powValue: ic => (ic === 4 ? InfinityChallenge(4).reward.effectValue : 1),
      isActive: ic => InfinityChallenge(ic).isCompleted,
      color: () => "var(--color-infinity)",
      barOverlay: ic => `∞<i class="fas fa-arrow-down-wide-short" />${ic}`,
    },
    eternityChallenge: {
      name: ec => `Effect from Eternity Challenge ${ec}`,
      multValue: (ec, dim) => {
        if (dim?.length === 2) {
          let totalEffect = DC.D1;
          for (let tier = 1; tier < MultiplierTabHelper.activeDimCount(dim); tier++) {
            totalEffect = totalEffect.times((MultiplierTabHelper.ECDimCheck(ec, `${dim}${tier}`) &&
              EternityChallenge(ec).completions > 0) ? EternityChallenge(ec).reward.effectOrDefault(1) : 1);
          }
          return totalEffect;
        }
        if (ec === 2) return dim === 1 ? EternityChallenge(ec).reward.effectValue : DC.D1;
        return EternityChallenge(ec).reward.effectValue;
      },
      isActive: ec => EternityChallenge(ec).completions > 0,
      color: () => "var(--color-eternity)",
      barOverlay: ec => `Δ<i class="fas fa-arrow-down-wide-short" />${ec}`,
    },
  }
};