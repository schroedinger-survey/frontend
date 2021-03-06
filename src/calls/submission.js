import axios from "axios";
import storageManager from "../storage/StorageManager";
import Logger from "../utils/Logger";
const log = new Logger("src/calls/submission.js");
const InitialCache = {
    submissions: null
}

/**
 * Used in:
 * - Submissions
 * - SurveyOverview
 */
class SubmissionAPIHandler {

    /**
     * Cache only works for submissionCount !!!
     * @param func
     * @param name
     * @param survey_id
     * @returns {*}
     */
    static cacheMiddleware(func: function, name: string, survey_id: string){
        let Cache = sessionStorage.getItem("SUBMISSION_CACHE");
        if(Cache === null || JSON.parse(Cache).submissions === null){
            return func();
        }else{
            const now = Math.round(new Date().getTime()/1000);
            const lastCheck = JSON.parse(sessionStorage.getItem("SUBMISSION_LAST_UPDATE"));

            if(lastCheck !== null && ((lastCheck + 60) < now)){ // Cache for Submission count is valid for 2 minutes
                sessionStorage.removeItem("SUBMISSION_CACHE");
                return func();
            } else {
                Cache = JSON.parse(Cache);
                const countArray = Cache; // Only the submission Array is in Cache
                const countMap = new Map(countArray.map(i => [i[0], i[1]])) // Convert Array back to Map
                if (countMap.has(survey_id)) {
                    return countMap.get(survey_id);
                } else {
                    return func();
                }
            }
        }
    }

    /**
     * Works specifically only for submissionCount !!!
     * @param name
     * @param data
     * @param id
     */
    static setStorage(name: string, data: string, id: string){
        let Cache = sessionStorage.getItem("SUBMISSION_CACHE");
        const now = Math.round(new Date().getTime()/1000);
        if(Cache === null){
            InitialCache.submissions = new Map();
            InitialCache.submissions.set(id, data);

            // Map can not be persisted in storage, has to be converted to an array !
            sessionStorage.setItem("SUBMISSION_CACHE", JSON.stringify([...InitialCache.submissions]));

            sessionStorage.setItem("SUBMISSION_LAST_UPDATE", JSON.stringify(now));
        } else {
            const CacheObject = JSON.parse(Cache);
            const countMap = new Map(CacheObject.map(i => [i[0], i[1]])) // Convert Array back to Map
            if(countMap.has(id)){
                countMap.delete(id);
            }
            countMap.set(id, data);
            sessionStorage.setItem("SUBMISSION_CACHE", JSON.stringify([...countMap]));

            sessionStorage.removeItem("SUBMISSION_LAST_UPDATE");
            sessionStorage.setItem("SUBMISSION_LAST_UPDATE", JSON.stringify(now))
        }

    }

    /**
     * Gets the count of all submission belonging to one specific survey
     * @param id
     * @returns {Promise<{log: string}|AxiosResponse<any>>}
     */
    static async submissionCount(id: string){
        log.debug("GET SUBMISSION COUNT", id);
        try{
            const response = await axios({
                method: "GET",
                url: "/api/v1/submission/count?survey_id=" + id,
                headers: {
                    "Authorization": storageManager.getJWTToken()
                }
            });
            if (response.status === 200){
                SubmissionAPIHandler.setStorage("submissions", response.data.count, id);
                return response.data.count;
            }
        } catch (e){
            log.error("Error in submissionCount:",e);
        }
    }

    /**
     * Gets all Submissions belonging to a survey
     * @param id of the Survey the requested submission belong to
     * @param pageNumber
     * @param itemsPerPage
     * @returns {Promise<AxiosResponse<any>>}
     */
    static async submissionGet(id: string, pageNumber= 0, itemsPerPage= 3){
        log.debug("GET ALL SUBMISSIONS FROM A SURVEY");
        try{
            return await axios({
                method: "GET",
                url: "/api/v1/submission?survey_id=" + id + "&page_number=" + pageNumber + "&page_size=" + itemsPerPage,
                headers: {
                    "Authorization": storageManager.getJWTToken()
                }
            });
        }catch (e) {
            log.error("Error in submissionGet:", e.response);
        }
    }

    /**
     * Submits a valid Survey Submission
     * @param constrainedAnswers - array of all submitted answers of type constrained
     * @param freestyleAnswers - array of all submitted answers of type freestyle
     * @param survey - needed for id property
     * @param token - is null for public survey and given for private survey
     * @returns {Promise<{type: string, message: string, status: boolean}>} used for Message
     */
    static async submitAnsweredSurvey(constrainedAnswers: Array<Record<string, any>>, freestyleAnswers: Array<string, any>, survey: Record<string, any>, token: string){
        try {
            let submitResponse
            if (survey.secured){
                try{
                    submitResponse = await axios({
                        method: "POST",
                        url: "/api/v1/submission?token=" + token,
                        data: {
                            survey_id: survey.id,
                            constrained_answers: constrainedAnswers,
                            freestyle_answers: freestyleAnswers
                        }
                    });
                }catch (e){
                    log.debug("Error in submitAnsweredSurvey:", e.response);
                    return {status: true, type: "danger", message: e.response.data.human_message}
                }
            } else {
                try{
                    submitResponse = await axios({
                        method: "POST",
                        url: "/api/v1/submission",
                        data: {
                            survey_id: survey.id,
                            constrained_answers: constrainedAnswers,
                            freestyle_answers: freestyleAnswers
                        }
                    });
                } catch (e) {
                    log.debug("Error in submitAnsweredSurvey:", e.response);
                    return {status: true, type: "danger", message: e.response.data.human_message}
                }
            }
            log.debug("Response of submitting the submission", submitResponse);
            if (submitResponse.status === 201) {
                log.debug("Survey Submission was submitted", survey.id, constrainedAnswers, freestyleAnswers);
                return {status: true, type: "success", message: "Your answers were submitted."}
            }else {
                return {status: true, type: "danger", message: "Something went wrong. Please try again!"}
            }
        } catch (e) {
            log.error("Error in submitAnsweredSurvey:", e.response);
            return {status: true, type: "danger", message: "Something went wrong. Please try again!"}
        }
    }

    /**
     * Gets a specific submission based on a given submission_id
     * scenario: Look at submission tied to a used token in ShareLinks
     * @param id of the requested submission
     * @returns {Promise<void>}
     */
    static async usedTokenSubmissionGet(id: string){
        try{
            return await axios({
                method: "GET",
                url: "/api/v1/submission/"+ id,
                headers: {
                    "Authorization": storageManager.getJWTToken()
                }
            })
        } catch (e){
            log.error("Error in usedTokenSubmissionGet:", e.response);
            return {
                log: "Failed axios request was caught: usedTokenSubmissionGet"
            };
        }
    }

}

export default SubmissionAPIHandler;