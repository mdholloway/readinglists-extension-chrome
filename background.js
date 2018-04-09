const projectHosts = [
    'wikipedia.org',
    'wikidata.org',
    'wikivoyage.org',
    'wiktionary.org',
    'wikibooks.org',
    'mediawiki.org',
    'wikisource.org',
    'wikiversity.org',
    'wikinews.org',
    'wikiquote.org',
    'meta.wikimedia.org',
    'incubator.wikimedia.org',
    'commons.wikimedia.org',
    'species.wikimedia.org'
]

const showIconConditions = projectHosts.map(hostSuffix => new chrome.declarativeContent.PageStateMatcher({
    pageUrl: { hostSuffix },
}));

chrome.runtime.onInstalled.addListener(() => {    
    chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
        chrome.declarativeContent.onPageChanged.addRules([
            {
                conditions: showIconConditions,
                actions: [ new chrome.declarativeContent.ShowPageAction() ]
            }
        ]);
    });
});
