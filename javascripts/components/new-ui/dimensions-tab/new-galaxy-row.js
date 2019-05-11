Vue.component('new-galaxy-row', {
  data() {
    return {
      type: "",
      galaxies: {
        normal: 0,
        replicanti: 0,
        dilation: 0
      },
      requirement: {
        tier: 1,
        amount: 0
      },
      canBeBought: false,
      hasIncreasedScaling: false,
      hasReplicantiGalaxies: false,
      hasDilationGalaxies: false,
      costScalingText: "",
      lockMessage: null,
    };
  },
  computed: {
    dimName() {
      return SHORT_DISPLAY_NAMES[this.requirement.tier];
    },
    buttonMessage() {
      return this.lockMessage
        ? this.lockMessage
        : "Lose all your previous progress, but get a tickspeed boost";
    }
  },
  methods: {
    update() {
      this.type = Galaxy.type;
      this.galaxies.normal = player.galaxies;
      this.galaxies.replicanti = Replicanti.galaxies.total;
      this.galaxies.dilation = player.dilation.freeGalaxies;
      const requirement = Galaxy.requirement;
      this.requirement.amount = requirement.amount;
      this.requirement.tier = requirement.tier;
      this.canBeBought = requirement.isSatisfied && Galaxy.canBeBought;
      this.hasReplicantiGalaxies = this.galaxies.replicanti !== 0;
      this.hasDilationGalaxies = this.galaxies.dilation !== 0;
      if (Galaxy.canBeBought) {
        this.lockMessage = null;
      } else if (EternityChallenge(6).isRunning) {
        this.lockMessage = "Locked (Eternity Challenge 6)";
      } else if (InfinityChallenge(7).isRunning) {
        this.lockMessage = "Locked (Infinity Challenge 7)";
      } else if (NormalChallenge(8).isRunning) {
        this.lockMessage = "Locked (8th Dimension Autobuyer Challenge)";
      } else {
        this.lockMessage = null;
      }
      this.updateCostScaling();
    },
    secondSoftReset() {
      galaxyResetBtnClick();
    },
    updateCostScaling() {
      const distantStart = EternityChallenge(5).isRunning ? 0 : Galaxy.costScalingStart;
      this.hasIncreasedScaling = player.galaxies > distantStart;
      if (Galaxy.type.startsWith("Distant")) {
        this.costScalingText = `Each galaxy is more expensive past ${distantStart} galaxies`;
        return;
      }
      if (Galaxy.type.startsWith("Remote")) {
        const remoteStart = 800;
        this.costScalingText = "Increased galaxy cost scaling: " +
          `Quadratic past ${distantStart} (distant), exponential past ${remoteStart} (remote)`;
        return;
      }
      this.costScalingText = "";
    }
  },
  template:
  `<div class="reset-container galaxy">
    <h4>{{type}} ({{shortenSmallInteger(galaxies.normal)}}<span v-if="hasReplicantiGalaxies"> + {{shortenSmallInteger(galaxies.replicanti)}}</span><span v-if="hasDilationGalaxies"> + {{shortenSmallInteger(galaxies.dilation)}}</span>)
    </h4>
    <span>Requires: {{shortenSmallInteger(requirement.amount)}} {{dimName}} D</span>
    <div v-if="hasIncreasedScaling">{{costScalingText}}</div>
    <button 
      class="storebtn" style="height: 56px; font-size: 1rem;"
      :class="{ 'storebtn-unavailable': !canBeBought }"
      @click="secondSoftReset"
      :enabled="canBeBought"
    >{{buttonMessage}}</button>
  </div>`
})