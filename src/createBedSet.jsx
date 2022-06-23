import React from "react";
import MaterialTable from "material-table";
import { tableIcons } from "./tableIcons";
import ResponsiveDialog from "./downloadMyBetSet";
import { Paper } from "@material-ui/core";
import Container from "react-bootstrap/Container";
import { FaTrashAlt } from "react-icons/fa";
import { FaDownload } from "react-icons/fa";
import Header from "./header";
import VersionsSpan from "./versionsSpan";
import axios from "axios";
import bedhost_api_url from "./const/server";
import "./style/home.css";

const api = axios.create({
  baseURL: bedhost_api_url,
});

export default class CreateBedSet extends React.Component {
  constructor() {
    super();
    this.state = {
      myBedSetName: "",
      myBedSet: JSON.parse(localStorage.getItem('myBedSet')),
      myBedSetIdx: ""
    };
  }

  async componentDidMount() {
    if (this.state.myBedSet) {
      this.getBedIdx()
    }

  }

  async createBedSet() {

    let md = await api.post(
      "/api/bedset/create/" +
      this.state.myBedSetName +
      "/" +
      this.state.myBedSetIdx
    ).then(({ data }) => data)

    alert("Your BED set has been submitted for processing!")

    localStorage.clear();

  }

  handleChange(e) {
    this.setState({ myBedSetName: e.target.value });

  }
  getBedIdx() {
    let idx_list = []

    idx_list.push(
      this.state.myBedSet.map((bed) => {
        return bed.id;
      })
    )

    idx_list = encodeURIComponent(
      idx_list.toString()
    )

    this.setState({
      myBedSetIdx: idx_list
    })
    this.forceUpdate();
  }

  render() {
    return (
      <React.StrictMode>
        <Header />
        <div
          className="conten-body"
        >
          <Container style={{ width: "75%" }} fluid className="p-4">
            <h1>My BED Set</h1>
          </Container>

          {this.state.myBedSet ? (
            <Container style={{ width: "75%" }} fluid className="p-4">
              <MaterialTable
                title="My BED Set"
                icons={tableIcons}
                columns={[
                  { title: 'Name', field: 'name' },
                  { title: 'md5sum', field: 'md5sum', hidden: true, }
                ]}
                data={this.state.myBedSet}
                actions={[
                  rowData => ({
                    icon: () => <a
                      href={bedhost_api_url + "/api/bed/" + rowData.md5sum + "/file/bed"}
                    ><FaDownload color='#e76f51' /></a>,
                    tooltip: 'Save User',
                    onClick: (event, rowData) => alert("Download " + rowData.name)
                  }),
                  {
                    icon: () => <FaTrashAlt color='#e76f51' />,
                    tooltip: 'Delete BED file',
                    onClick: (event, rowData) =>
                      new Promise((resolve, reject) => {
                        setTimeout(() => {
                          const dataDelete = [...this.state.myBedSet];
                          const index = rowData.tableData.id;
                          dataDelete.splice(index, 1);
                          this.setState({
                            myBedSet: dataDelete
                          }, () => {
                            localStorage.setItem('myBedSet', JSON.stringify(this.state.myBedSet))
                          });
                          resolve()
                        }, 1000)
                      }),
                  }
                ]}
                options={{
                  headerStyle: {
                    backgroundColor: "#264653",
                    color: "#FFF",
                    fontWeight: "bold",
                  },
                  actionsColumnIndex: -1,
                  actionsCellStyle: { justifyContent: "center" },
                  paging: true,
                  search: false,
                  toolbar: false,
                }}
                components={{
                  Container: (props) => <Paper {...props} elevation={0} />,
                }}
              />
              <ResponsiveDialog
                bedfiles={this.state.myBedSetIdx}
                btn={'Download My BED Set'}
              />

              <button
                style={{ height: "33px" }}
                className="float-right btn btn-sm my-btn"
                onClick={this.createBedSet.bind(this)}
              >
                Create My BED Set
              </button>

              <input
                type="text"
                placeholder="My BED set name"
                style={{ height: "33px", fontSize: 12 }}
                className="float-right"
                value={this.state.myBedSetName}
                onChange={this.handleChange.bind(this)}
              />
            </Container>
          ) : (
            <Container style={{ width: "75%" }} fluid className="p-4">
              <h1 >Your BED set cart is empty. </h1>
            </Container>
          )
          }
        </div>
        <VersionsSpan />
      </React.StrictMode>
    );
  }
}
