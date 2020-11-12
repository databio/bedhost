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
import ResultsBed from './queryResultsBed'
import ResultsBedSet from './queryResultsBedSet'

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
            expanded: false,
            bedData: [],
            bedSetData: []
        };
    }

    async componentDidMount() {
        this.getQueryResult()
    }

    componentDidUpdate(prevProps, prevState) {
        if ((prevProps.query !== this.props.query) || (prevProps.table_name !== this.props.table_name)) {
            this.setState({ bedSetData: [], bedData: [] })
            this.getQueryResult()
            console.log(prevProps.query, this.props.query)
            console.log(prevProps.table_name, this.props.table_name)
        }
    }

    async getQueryResult() {
        let query = this.props.query.sql.replaceAll("?", "%s");

        let query_val = this.props.query.params.map((val, index) => {
            let my_query_val = ''
            if (index === 0) {
                my_query_val = "?query_val=" + val
            } else { my_query_val = my_query_val + "&query_val=" + val }
            return my_query_val
        }).join('');

        let data = await api.get("/_private_api/query/" + this.props.table_name + "/" + query + query_val)
            .then(({ data }) => data)

        console.log("Search results: ", data)
        if (this.props.table_name === "bedfiles") {
            this.setState({ bedData: data })
        } else {
            // data.map(async (bedset, index) => {
            //     let res = await api.get("/api/bedset/" + bedset[1] + "/bedfiles")
            //     .then(({ data }) => data)
            //     let bedCount = res.data.length
            //     bedset.push(bedCount)             
            // })
            // console.log(data)
            this.setState({ bedSetData: data })
            console.log(this.state.bedSetData)
        }
    }


    async getbedData(id) {
        let data = await api
            .get("/api/bedset/" + id + "/bedfiles")
            .then(({ data }) => data)
            .catch(function (error) {
                alert(error + "; is bedhost running at " + bedhost_api_url + "?");
            });
        console.log(
            "BED files names retrieved from the server for BED set: ",
            data
        );
        this.setState({ bedData: data.data });
    };

    handleChange(panel) {
        this.getbedData(panel);
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
            <div>
                {this.props.table_name === "bedfiles" ? (
                    // this.state.bedData.map((bed) => {
                    //     return (
                    //         <ListGroup.Item as="li" key={bed[0]}>
                    //             <Link className="home-link" to={{
                    //                 pathname: '/bedsplash/' + bed[1]
                    //             }}>
                    //                 {bed[3]}
                    //             </Link>
                    //         </ListGroup.Item>
                    //     );
                    // })
                    this.state.bedData.length !== 0 ? (<ResultsBed data={this.state.bedData} />) : null
                ) : (this.state.bedSetData.map((bedSet, index) => {
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
                                    {this.state.bedData.map((bed) => {
                                        return (
                                            <li as="li" key={bed[0]}>
                                                <Link className="home-link" to={{
                                                    pathname: '/bedsplash/' + bed[1]
                                                }}>
                                                    {bed[3]}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                    {/* {this.state.bedData.length!==0 ? (<ResultsBed data={this.state.bedData} /> ) :null} */}
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    )
                })
                    )}
                    {this.state.bedSetData.length!==0 ? (<ResultsBedSet data={this.state.bedSetData} /> ) :null}
            </div>

        );

    }
}