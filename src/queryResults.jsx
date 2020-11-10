import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Link } from "react-router-dom";
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import Typography from '@material-ui/core/Typography';
import ListGroup from "react-bootstrap/ListGroup";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import bedhost_api_url from "./const";
import axios from "axios";



const Accordion = withStyles({
    root: {
        border: '1px solid rgba(0, 0, 0, .125)',
        boxShadow: 'none',
        '&:not(:last-child)': {
            borderBottom: 0,
        },
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: 'rgba(0, 0, 0, .03)',
        borderBottom: '1px solid rgba(0, 0, 0, .125)',
        marginBottom: -1,
        minHeight: 56,
        '&$expanded': {
            minHeight: 56,
        },
    },
    content: {
        '&$expanded': {
            margin: '12px 0',
        },
    },
    expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
    root: {
        padding: theme.spacing(2),
    },
}))(MuiAccordionDetails);

const api = axios.create({
    baseURL: bedhost_api_url,
});

export default class QueryResults extends React.Component {
    constructor() {
        super();
        this.state = {
            bedSetNames: [],
            bedFileNames: [],
            expanded: false
        };
    }

    async componentDidMount() {
        this.getQueryResult()
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.query !== this.props.query) {
            this.getQueryResult()
        }
    }

    async getQueryResult() {
        let my_query = JSON.parse(this.props.query)
        let data = await api.get("/_private_api/query/" + this.props.table_name + "/" + my_query + "?column=name")
            .then(({ data }) => data)

        console.log(data)
        if (this.props.table_name === "bedfiles") {
            this.setState({ bedFileNames: data })
        } else { this.setState({ bedSetNames: data }) }
    }


    async getBedFileNames(id) {
        let data = await api
            .get("/api/bedset/" + id + "/data")
            .then(({ data }) => data)
            .catch(function (error) {
                alert(error + "; is bedhost running at " + bedhost_api_url + "?");
            });
        console.log(
            "BED files names retrieved from the server for BED set: ",
            data
        );
        this.setState({ bedFileNames: data.data[0][11] });
    };

    handleChange(panel) {
        this.getBedFileNames(panel);
        if (this.state.expanded === panel) {
            this.setState({
                expanded: false
            })
        } else {
            this.setState({
                expanded: panel
            })
        }
    };
    render() {
        return (
            <div style={{ marginTop: '30px' }}>
                {this.props.table_name === "bedfiles" ? (
                    this.state.bedFileNames.map((bedFile) => {
                        return (
                            <ListGroup.Item as="li" key={bedFile[0]}>
                                <Link className="home-link" to={{
                                    pathname: '/bedfilesplash/' + bedFile[1]
                                }}>
                                    {bedFile[3]}
                                </Link>
                            </ListGroup.Item>
                        );
                    })
                ) : (
                        this.state.bedSetNames.map((bedSet, index) => {
                            return (
                                <Accordion key={index} square expanded={this.state.expanded === bedSet[1]} onChange={() => this.handleChange(bedSet[1])}>
                                    <AccordionSummary expandIcon={<ExpandMoreIcon />} style={{ minHeight: "50px" }} aria-controls="panel1d-content" id="panel1d-header">
                                        <Typography>
                                            <Link className="home-link" to={{
                                                pathname: '/bedsetsplash/' + bedSet[1]
                                            }}>
                                                {bedSet[2]}
                                            </Link>
                                        </Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Typography>
                                            {Object.entries(this.state.bedFileNames)
                                                .map(([key, value], index) => {
                                                    return (
                                                        <li as="li" key={index}>
                                                            <Link className="home-link" to={{
                                                                pathname: '/bedfilesplash/' + value
                                                            }}>
                                                                {key}
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                        </Typography>
                                    </AccordionDetails>
                                </Accordion>
                            )
                        })
                    )}


            </div>
        );
    }
}