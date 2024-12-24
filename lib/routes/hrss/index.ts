import { Route } from '@/types';
import got from '@/utils/got';
import { load } from 'cheerio';
import { parseDate } from '@/utils/parse-date';

export const route: Route = {
    path: '/hrss/:category?',
    categories: ['government'],
    example: '/hrss/jnjs',
    parameters: { category: '分类，见下表，默认为 jnjs（技能鉴定）' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    name: '河南省技能人才评价工作网',
    maintainers: [''],
    handler,
    description: `| 技能鉴定 | 政策法规 | 新闻动态 |
  | :------: | :------: | :------: |
  |   jnjs   |   zcfg   |   xwdt   |`,
};

async function handler(ctx) {
    const category = ctx.req.param('category') ?? 'jnjs';
    const rootUrl = 'http://pjzdzx.hrss.henan.gov.cn';
    const currentUrl = `${rootUrl}/channels/${category}/`;

    const response = await got({
        method: 'get',
        url: currentUrl,
    });

    const $ = load(response.data);
    const list = $('.list-text li a')
        .toArray()
        .map((item) => {
            item = $(item);
            return {
                title: item.text(),
                link: new URL(item.attr('href'), rootUrl).href,
                pubDate: parseDate(item.next().text()),
            };
        });

    const items = await Promise.all(
        list.map((item) =>
            ctx.cache.tryGet(item.link, async () => {
                const detailResponse = await got({
                    method: 'get',
                    url: item.link,
                });
                const content = load(detailResponse.data);

                item.description = content('.TRS_Editor').html();
                return item;
            })
        )
    );

    return {
        title: '河南省技能人才评价工作网',
        link: currentUrl,
        item: items,
    };
}
