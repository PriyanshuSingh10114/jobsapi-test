const logger = require('../../../config/logger');

// Lazy-loaded registry of ATS connectors
const GreenhouseConnector = require('../greenhouse/GreenhouseConnector');
const LeverConnector = require('../lever/LeverConnector');
const AshbyConnector = require('../ashby/AshbyConnector');
const WorkdayConnector = require('../workday/WorkdayConnector');
const SmartRecruitersConnector = require('../smartrecruiters/SmartRecruitersConnector');
const ICIMSConnector = require('../icims/ICIMSConnector');
const TaleoConnector = require('../taleo/TaleoConnector');
const SuccessFactorsConnector = require('../successfactors/SuccessFactorsConnector');
const JobviteConnector = require('../jobvite/JobviteConnector');
const RecruiteeConnector = require('../recruitee/RecruiteeConnector');
const BambooHRConnector = require('../bamboohr/BambooHRConnector');
const TeamtailorConnector = require('../teamtailor/TeamtailorConnector');
const ComeetConnector = require('../comeet/ComeetConnector');
const PinpointConnector = require('../pinpoint/PinpointConnector');
const OracleRecruitingConnector = require('../oracle/OracleRecruitingConnector');
const WorkableConnector = require('../workable/WorkableConnector');
const RipplingConnector = require('../rippling/RipplingConnector');
const PersonioConnector = require('../personio/PersonioConnector');
const WellfoundConnector = require('../wellfound/WellfoundConnector');
const LinkedInEasyApplyConnector = require('../linkedin/LinkedInEasyApplyConnector');
const IndeedApplyConnector = require('../indeed/IndeedApplyConnector');
const ZipRecruiterConnector = require('../ziprecruiter/ZipRecruiterConnector');
const MonsterConnector = require('../monster/MonsterConnector');
const DiceConnector = require('../dice/DiceConnector');
const USAJobsConnector = require('../usajobs/USAJobsConnector');
const GenericATSConnector = require('../generic/GenericATSConnector');

class ATSConnectorFactory {
  static get connectorRegistry() {
    return {
      greenhouse: GreenhouseConnector,
      lever: LeverConnector,
      ashby: AshbyConnector,
      workday: WorkdayConnector,
      smartrecruiters: SmartRecruitersConnector,
      icims: ICIMSConnector,
      taleo: TaleoConnector,
      successfactors: SuccessFactorsConnector,
      jobvite: JobviteConnector,
      recruitee: RecruiteeConnector,
      bamboohr: BambooHRConnector,
      teamtailor: TeamtailorConnector,
      comeet: ComeetConnector,
      pinpoint: PinpointConnector,
      oracle: OracleRecruitingConnector,
      workable: WorkableConnector,
      rippling: RipplingConnector,
      personio: PersonioConnector,
      wellfound: WellfoundConnector,
      linkedin: LinkedInEasyApplyConnector,
      indeed: IndeedApplyConnector,
      ziprecruiter: ZipRecruiterConnector,
      monster: MonsterConnector,
      dice: DiceConnector,
      usajobs: USAJobsConnector,
      generic: GenericATSConnector
    };
  }

  /**
   * Instantiates an ATS connector plugin for a given ATS key.
   * @param {string} atsKey - Identified ATS key
   * @param {Object} automationContext - Active AutomationContext instance
   * @param {Object} sessionData - Active BrowserSession
   * @returns {Object} Instantiated ATS Connector
   */
  static createConnector(atsKey = 'generic', automationContext, sessionData) {
    const key = (atsKey || 'generic').toLowerCase();
    const ConnectorClass = this.connectorRegistry[key] || GenericATSConnector;
    
    logger.info(`[ATSConnectorFactory] Instantiating connector plugin for ATS key: '${key}' (${ConnectorClass.name})`);
    return new ConnectorClass(automationContext, sessionData);
  }
}

module.exports = ATSConnectorFactory;
