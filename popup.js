function getReadingListsUrlForOrigin(origin) {
    return `${origin}/api/rest_v1/data/lists/`;
}

function readingListSetupUrlForOrigin(origin) {
    return `${origin}/api/rest_v1/data/lists/setup`;
}

function readingListPostEntryUrlForOrigin(origin, listId, token) {
    return `${origin}/api/rest_v1/data/lists/${listId}/entries/?csrf_token=${encodeURIComponent(token)}`;
}

function csrfFetchUrlForOrigin(origin) {
    return `${origin}/w/api.php?action=query&format=json&formatversion=2&meta=tokens&type=csrf`;
}

function getCsrfToken(origin) {
    return fetch(csrfFetchUrlForOrigin(origin), { credentials: 'same-origin' })
        .then(res => res.json())
        .then(res => res.query.tokens.csrftoken);
}

function getDefaultListId(origin) {
    // TODO: Stash default list ID in LocalStorage once fetched for the first time?
    // Counterpoint: This could cause trouble if the user tears down and then sets up lists again.
    return fetch(getReadingListsUrlForOrigin(origin), { credentials: 'same-origin' })
        .then(res => res.json())
        .then(res => res.lists.filter(list => list.default)[0].id);
}

function parseTitleFromUrl(url) {
    return url.searchParams.has('title') ? url.searchParams.get('title') : url.pathname.replace('/wiki/', '');
}

function show(id) {
    document.getElementById(id).style.display = 'block';
}

function showLoginPrompt() {
    show('loginPromptContainer');
}

function showAddToListSuccessMessage() {
    show('addToListSuccessContainer');
}

function showAddToListFailureMessage(res) {
    chrome.extension.getBackgroundPage().console.log(res);
    document.getElementById('failureReason').textContent = res.detail ? res.detail : res.title ? res.title : res.type;
    show('addToListFailedContainer');
}

function getAddToListPostBody(url) {
    // TODO: handle m. URLs (by excising the m.)
    return `project=${url.origin}&title=${parseTitleFromUrl(url)}`;
}

function getAddToListPostOptions(url) {
    return {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        credentials: 'same-origin',
        body: getAddToListPostBody(url)
    }
}

function handleAddPageToListResult(res) {
    if (res.id) showAddToListSuccessMessage(); else showAddToListFailureMessage(res);
}

function addPageToDefaultList(url, listId, token) {
    return fetch(readingListPostEntryUrlForOrigin(url.origin, listId, token), getAddToListPostOptions(url))
    .then(res => res.json())
    .then(res => handleAddPageToListResult(res));
}

function handleTokenResult(url, token) {
    return token === '+\\' ? showLoginPrompt() : getDefaultListId(url.origin).then(listId => addPageToDefaultList(url, listId, token));
}

function handleClick(url) {
    // TODO: Add more filtering to declarativeContent conditions filter out non-page content (e.g., API responses)
    return getCsrfToken(url.origin).then(token => handleTokenResult(url, token));
}

chrome.tabs.getSelected(tab => {
    const url = new URL(tab.url);
    return handleClick(url)
    .catch(err => {
        if (err.title === 'readinglists-db-error-not-set-up') {
            // setUpReadingListsForUser().then(() => handleClick(url));
            chrome.extension.getBackgroundPage().console.log('readinglists-db-error-not-set-up caught!');
            showAddToListFailureMessage(err);
        } else {
            showAddToListFailureMessage(err);
        }
    });
});
