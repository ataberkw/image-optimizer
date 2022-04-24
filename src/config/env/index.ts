import * as dotenv from 'dotenv';

dotenv.config();

interface IConfig {
    port: string | number;
    megaphoneApiKey: string;
    mailerLite: string;
    podcastIndex: {
        PODCASTINDEX_API_KEY: string;
        PODCASTINDEX_API_SECRET: string;
    };
    notion: {
        TOKEN: string;
    }
    podcaser: {
        SECRET: string
        KEY: string;
    };
    elasticsearch: {
        USERNAME: string;
        PASSWORD: string;
    };
    database: {
        MONGODB_URI: string;
        MONGODB_DB_MAIN: string;
    };
    secret: string;
}


const NODE_ENV: string = process.env.NODE_ENV || 'development';

const development: IConfig = {
    port: process.env.PORT || 3000,
    megaphoneApiKey: process.env.MEGAPHONE_API_KEY || '',
    mailerLite: process.env.MAILER_LITE_API_KEY || '',
    notion: {
        TOKEN: process.env.NOTION_TOKEN || ''
    },
    database: {
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/',
        MONGODB_DB_MAIN: process.env.MONGODB_DB_MAIN || 'podcaster_app_launch'
    },
    elasticsearch: {
        USERNAME: process.env.ES_USERNAME || '',
        PASSWORD: process.env.ES_PASSWORD || ''
    },
    podcaser: {
        KEY: process.env.PODCHASER_DEV_KEY || '',
        SECRET: process.env.PODCHASER_DEV_SECRET || ''
    },
    secret: process.env.SECRET || '@QEGTUI',
    podcastIndex: {
        PODCASTINDEX_API_KEY: process.env.PODCASTINDEX_API_KEY || '',
        PODCASTINDEX_API_SECRET: process.env.PODCASTINDEX_API_SECRET || ''
    }
};

const production: IConfig = {
    port: process.env.PORT || 3000,
    megaphoneApiKey: process.env.MEGAPHONE_API_KEY || '',
    mailerLite: process.env.MAILER_LITE_API_KEY || '',
    notion: {
        TOKEN: process.env.NOTION_TOKEN || ''
    },
    database: {
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://production_uri/',
        MONGODB_DB_MAIN: process.env.MONGODB_DB_MAIN || 'podcaster_app_launch'
    },
    elasticsearch: {
        USERNAME: process.env.ES_USERNAME || '',
        PASSWORD: process.env.ES_PASSWORD || ''
    },
    podcaser: {
        KEY: process.env.PODCHASER_PROD_KEY || '',
        SECRET: process.env.PODCHASER_PROD_SECRET || ''
    },
    secret: process.env.SECRET || '@QEGTUI',
    podcastIndex: {
        PODCASTINDEX_API_KEY: process.env.PODCASTINDEX_API_KEY || '',
        PODCASTINDEX_API_SECRET: process.env.PODCASTINDEX_API_SECRET || ''
    }
};

const test: IConfig = {
    port: process.env.PORT || 3000,
    megaphoneApiKey: process.env.MEGAPHONE_API_KEY || '',
    mailerLite: process.env.MAILER_LITE_API_KEY || '',
    notion: {
        TOKEN: process.env.NOTION_TOKEN || ''
    },
    database: {
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        MONGODB_DB_MAIN: 'test_podcaster_app_launch'
    },
    elasticsearch: {
        USERNAME: process.env.ES_USERNAME || '',
        PASSWORD: process.env.ES_PASSWORD || ''
    },
    podcaser: {
        KEY: process.env.PODCHASER_DEV_KEY || '',
        SECRET: process.env.PODCHASER_DEV_SECRET || ''
    },
    secret: process.env.SECRET || '@QEGTUI',
    podcastIndex: {
        PODCASTINDEX_API_KEY: process.env.PODCASTINDEX_API_KEY || '',
        PODCASTINDEX_API_SECRET: process.env.PODCASTINDEX_API_SECRET || ''
    }
};

const config: {
    [name: string]: IConfig
} = {
    test,
    development,
    production
};

export default config[NODE_ENV];
