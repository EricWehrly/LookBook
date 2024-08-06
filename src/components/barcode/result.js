import React from 'react';
import PropTypes from 'prop-types';

// (for now, this is a straight rip from )
// https://github.com/ericblade/quagga2-react-example
const Result = ({ result }) => (
    <li>
        {result.codeResult.code} [{result.codeResult.format}]
    </li>
);

Result.propTypes = {
    result: PropTypes.object
};

export default Result;
