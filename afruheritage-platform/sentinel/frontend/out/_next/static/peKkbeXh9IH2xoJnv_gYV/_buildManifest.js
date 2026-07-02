self.__BUILD_MANIFEST = {
  "__rewrites": {
    "afterFiles": [
      {
        "source": "/sentinel/:path*"
      },
      {
        "source": "/sentinel/api/sentinel/:path*"
      },
      {
        "source": "/sentinel/api/v1/billing/:path*"
      },
      {
        "source": "/sentinel/api/v1/vendors/:path*"
      }
    ],
    "beforeFiles": [],
    "fallback": []
  },
  "sortedPages": [
    "/_app",
    "/_error"
  ]
};self.__BUILD_MANIFEST_CB && self.__BUILD_MANIFEST_CB()