/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Art0 from '../../assets/images/art0.svg';
import Art1 from '../../assets/images/art1.svg';
import Art2 from '../../assets/images/art2.svg';
import Art3 from '../../assets/images/art3.svg';
import Art4 from '../../assets/images/art4.svg';
import Art5 from '../../assets/images/art5.svg';

type ArticleData = {
  img: string;
  title: string;
  description: string;
  link: string;
};

type Articles = {
  featured: ArticleData[];
  other: ArticleData[];
};

export const articleData: Articles = {
  featured: [
    {
      img: Art0,
      title: 'Get started with your Developer Sandbox',
      description:
        'Learn how to set up and use the Developer Sandbox, and learn to develop quicker than ever before.',
      link: 'https://developers.redhat.com/learn/openshift/get-started-your-developer-sandbox',
    },
    {
      img: Art1,
      title: 'Streamline automation in OpenShift Dev Spaces with Ansible',
      description:
        'Learn how to transform the way you develop and test Ansible automations by using OpenShift Dev Spaces, which provides isolated and tailored development environments.',
      link: 'https://developers.redhat.com/learn/openshift/streamline-automation-openshift-dev-spaces-ansible',
    },
    {
      img: Art2,
      title: 'How to deploy a Java application on Kubernetes in minutes',
      description:
        'Modernize a legacy Java application by creating microservices, moving it into a container, then deploying it to Red Hat OpenShift using only Kubernetes commands.',
      link: 'https://developers.redhat.com/learn/java/how-deploy-java-application-kubernetes-minutes',
    },
  ],
  other: [
    {
      img: Art3,
      title: 'Foundations of OpenShift',
      description:
        'Learn the foundations of OpenShift through hands-on experience deploying and working with applications.',
      link: 'https://developers.redhat.com/learn/openshift/foundations-openshift',
    },
    {
      img: Art4,
      title: 'Using OpenShift Pipelines',
      description:
        'Learn how to use OpenShift Pipelines for automated builds and deployments – known as CI/CD – of container-based applications to reduce mistakes, improve productivity, and promote more thorough testing.',
      link: 'https://developers.redhat.com/learn/openshift/using-openshift-pipelines',
    },
    {
      img: Art5,
      title:
        'OpenShift virtualization and application modernization using the Developer Sandbox',
      description:
        'Learn how to create and manage your virtual machines (VMs) using Red Hat OpenShift and the Developer Sandbox, a no-cost OpenShift cluster with no need for setup or configuration.',
      link: 'https://developers.redhat.com/learn/openshift/openshift-virtualization-and-application-modernization-using-developer-sandbox',
    },
  ],
};
