(() => {

    document.addEventListener('DOMContentLoaded', () => {

        let configLink = document.querySelector('#configLink');
        configLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'none';
            document.querySelector('div#config').style.display = 'block';
        });

        configLink.click();

        let closeConfigLink = document.querySelector('#closeConfigLink');

        closeConfigLink.addEventListener('click', e => {
            e.preventDefault();

            document.querySelector('div#displays').style.display = 'block';
            document.querySelector('div#config').style.display = 'none';
        });

        let parameters = document.querySelector('#parameters');
        parameters.setAttribute('disabled', 'disabled');

        document.querySelector('#closeConfigLink')
    });


})();

export default {};