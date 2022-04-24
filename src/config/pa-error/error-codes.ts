export enum PErrorCode {
    unknown = "0",
    notAuthorized = "1",
    successful = "2",
    userNotExists = "3",

    // -- LoginResponse -- //
    login = "234-0",
    verification = "234-1",
    wrongCredentials = "234-2",
    formError = "234-3",
    jwtFormatException = "234-4",
    mailExists = "234-5",
    weakPassword = '234-6',
    bindError = '234-7',
    verifyEmail = '234-8',
    alreadyConnectedViaSocial = '234-9',
    invalidEmailType = '234-10',
    spotifyIsLackOfProperty = '234-11',
    appleJWTError = '234-12',

    // -- Verification -- //
    waitToSend = "235-0",
    alreadyVerificated = "235-1",
    sent = "235-2",
    notVerificated = "235-3",

    // -- ResetPassword -- //
    resetPasswordUserNotExist = "236-0",
    resetPasswordWrongEmail = "236-1",
    resetPasswordWrongCredential = "236-2",
    resetPasswordWeakPassword = "236-3",
    resetPasswordWrongPasswordResetToken = "236-4",

    // -- GetChartXPodcast -- //
    getChartXPodcast_XIsBiggerThanLength = "237-0",

    importPodcast_ImportSpam = "238-0",
    importPodcast_InvalidProvider = '238-1',

    // -- SelectInitialPlan -- //
    selectInitialPlan_InvalidPlan = '239-0',

    // -- PingListenSession -- //
    pingListenSession_Spam = '240-0',

    // -- PostComment -- //
    postComment_episodeNotFound = '241-0',
    postComment_commentNotFound = '241-1',
    postComment_commentAtIsHigherThanDuration = '241-2',

    // -- PostCommentReaction -- //
    postCommentReaction_invalidReaction = '242-0',

}