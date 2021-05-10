import {gql} from "@apollo/client";

export const GET_SAMPLE_BED = gql`
    query bedfiles($first: Int!) {
        bedfiles(first: $first){
            edges {
                node{
                    md5sum
                }
            }
        }
    }
`

export const GET_SAMPLE_BEDSET = gql`
    query bedsets($first: Int!) {
        bedsets(first: $first){
            edges {
                node{
                    md5sum
                }
            }
        }
    }
`

export const GET_BED_META = gql`
    query bedfiles($md5sum: String!) {
        bedfiles(filters: {md5sum: $md5sum}){
            edges {
                node{
                    other
                }
            }
        }
    }
`

export const GET_BED_STATS = gql`
    query bedfiles($md5sum: String!) {
        bedfiles(filters: {md5sum: $md5sum}){
            edges {
                node{
                    gcContent
                    regionsNo
                    meanAbsoluteTssDist
                    meanRegionWidth
                    exonPercentage
                    intronPercentage
                    promoterproxPercentage
                    intergenicPercentage
                    promotercorePercentage
                    fiveutrPercentage
                    threeutrPercentage
                }
            }
        }
    }
`