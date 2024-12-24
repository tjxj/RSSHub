import { Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/jnjs',
    categories: ['government'],
    example: '/hrss/jnjs',
    parameters: {},
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: {
        source: ['pjzdzx.hrss.henan.gov.cn/channels/jnjs/*'],
    },
    name: '河南省技能人才评价工作网 - 通知公告',
    maintainers: [''],
    handler,
    url: 'pjzdzx.hrss.henan.gov.cn/channels/jnjs/',
};

async function handler() {
    const baseUrl = 'http://pjzdzx.hrss.henan.gov.cn';
    const link = `${baseUrl}/channels/jnjs/`;

    const response = await got(link);
    const $ = load(response.data);

    const list = $('.list-unstyled li')
        .toArray()
        .map((item) => {
            item = $(item);
            const a = item.find('a');
            return {
                title: a.attr('title'),
                link: new URL(a.attr('href'), baseUrl).href,
                pubDate: parseDate(item.find('.pull-right').text().trim()),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            cache.tryGet(item.link, async () => {
                const response = await got(item.link);
                const $ = load(response.data);

                item.description = $('.article-content').html();
                return item;
            })
        )
    );

    return {
        title: '河南省技能人才评价工作网 - 通知公告',
        link,
        item: items,
    };
}
