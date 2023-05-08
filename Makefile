STATE_REPOSITORY=$(MC_STATE_ACCOUNT).dkr.ecr.us-east-2.amazonaws.com/nemesis
STAGING_REPOSITORY=$(MC_STAGING_ACCOUNT).dkr.ecr.us-east-2.amazonaws.com/nemesis
PRODUCTION_REPOSITORY=$(MC_PRODUCTION_ACCOUNT).dkr.ecr.us-east-2.amazonaws.com/nemesis

TAG=`git describe --abbrev=1 --tags --always`
STATE_IMAGE="$(STATE_REPOSITORY):v$(TAG)"
STAGING_IMAGE="$(STAGING_REPOSITORY):v$(TAG)"
PRODUCTION_IMAGE="$(PRODUCTION_REPOSITORY):v$(TAG)"

STATE_PROFILE?=metalcore-deploy-state
STAGING_PROFILE?=metalcore-deploy-staging
PRODUCTION_PROFILE?=metalcore-deploy-production

NO_COLOR='\033[0m'
RED="\033[0;31m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
BLUE='\033[0;34m'

default: build

tag:
	@echo "Current tag is '$(TAG)'"

image:
	@echo "Current image is '$(IMAGE)'"

build:
	@echo "## Building the docker image ##"
	@docker build -t $(STATE_IMAGE) .

login:
	`aws ecr get-login --no-include-email --profile=$(STATE_PROFILE) --region=$(MC_DEFAULT_REGION)`

push: login
	@echo "## Pushing image to AWS ##"
	@docker push $(STATE_IMAGE)

use-staging:
	@echo "## Using staging ##"
	@aws eks update-kubeconfig --profile=$(STAGING_PROFILE) --name kubernetes-staging-v1 --region=$(MC_DEFAULT_REGION)

use-production:
	@echo "## Using production ##"
	@aws eks update-kubeconfig --profile=$(PRODUCTION_PROFILE) --name kubernetes-production-v1 --region=$(MC_DEFAULT_REGION)

deploy-staging: build push use-staging
	@echo "## Deployed to staging ##"
	@kubectl set image deployment/nemesis-api nemesis=$(STAGING_IMAGE) -n nemesis
	@kubectl set image deployment/nemesis-asset-deposit-worker nemesis=$(STAGING_IMAGE) -n nemesis
	@kubectl set image deployment/nemesis-asset-withdraw-worker nemesis=$(STAGING_IMAGE) -n nemesis
	@kubectl set image deployment/nemesis-scheduler nemesis=$(STAGING_IMAGE) -n nemesis
	@kubectl set image deployment/nemesis-transaction-worker nemesis=$(STAGING_IMAGE) -n nemesis

deploy-production: build push use-production
	@echo "## Deployed to production ##"
	@kubectl set image deployment/nemesis-api nemesis=$(PRODUCTION_IMAGE) -n nemesis
